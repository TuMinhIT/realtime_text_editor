import * as signalR from "@microsoft/signalr";
import { sessionService } from "./sessionService";

const HUB_URL = import.meta.env.VITE_SIGNALR_URL;

let connection = null; //websocket connection instance
let connectionPromise = null; // race condition guard for connection initialization
let presenceCallback = null;
let lockCallback = null;
let currentSectionId = null;
let sectionUpdatedCallback = null;

/* =========================
   CORE CONNECTION
========================= */

async function ensureConnection() {
  // 1. Already connected
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  // 2. Prevent race condition
  if (connectionPromise) {
    return connectionPromise;
  }

  // 3. Create connection once
  connectionPromise = (async () => {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem("accessToken") || "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    /* ========= LIFE CYCLE ========= */

    connection.onreconnecting((err) => {
      console.warn("[SignalR] reconnecting...", err);
    });

    connection.onreconnected(async () => {
      //console.log("[SignalR] reconnected");

      // restore state after reconnect
      if (currentSectionId) {
        await connection.invoke("JoinSection", { sectionId: currentSectionId });
      }

      // rebind events safely
      if (presenceCallback) {
        connection.on("SectionPresenceUpdated", presenceCallback);
      }

      if (lockCallback) {
        connection.on("SectionLockUpdated", lockCallback);
      }

      //section update:
      if (sectionUpdatedCallback) {
        connection.on("SectionContentUpdated", sectionUpdatedCallback);
      }
    });

    connection.onclose((err) => {
      console.warn("[SignalR] connection closed", err);
    });

    await connection.start();

    //console.log("[SignalR] connected");

    return connection;
  })();

  const conn = await connectionPromise;
  // connectionPromise = null;

  return conn;
}

/* =========================
   SERVICE API
========================= */

export const signalRService = {
  /* ---------- CONNECT ---------- */
  async connect() {
    try {
      await ensureConnection();
      return true;
    } catch (err) {
      console.error("[SignalR] connect error", err);
      return false;
    }
  },

  /* ---------- DISCONNECT ---------- */
  async disconnect() {
    try {
      if (!connection) return true;

      await connection.stop();

      connection = null;
      connectionPromise = null;
      presenceCallback = null;
      lockCallback = null;
      currentSectionId = null;

      //sectioncontent:

      sectionUpdatedCallback = null;

      return true;
    } catch (err) {
      console.error("[SignalR] disconnect error", err);
      return false;
    }
  },

  /* ---------- SECTION ---------- */
  async joinSection(sectionId) {
    try {
      const conn = await ensureConnection();

      currentSectionId = sectionId;

      await conn.invoke("JoinSection", { sectionId });

      return true;
    } catch (err) {
      console.error("[SignalR] joinSection error", err);
      throw err;
    }
  },

  async leaveCurrentSection() {
    try {
      const conn = await ensureConnection();

      currentSectionId = null;

      await conn.invoke("LeaveCurrentSection");

      return true;
    } catch (err) {
      console.error("[SignalR] leaveCurrentSection error", err);
      throw err;
    }
  },

  /* ---------- EDIT SESSION ---------- */
  async requestEditSession(sectionId) {
    try {
      const conn = await ensureConnection();

      await conn.invoke("RequestEditSession", sectionId);

      return true;
    } catch (err) {
      console.error("[SignalR] requestEditSession error", err);
      throw err;
    }
  },

  // Mở lại phiên chỉnh sửa cho một section, thường được gọi khi người dùng rời khỏi section hoặc mất kết nối
  async releaseEditSession(sectionId) {
    try {
      const conn = await ensureConnection();
      await conn.invoke("ReleaseEditSession", sectionId);

      return true;
    } catch (err) {
      console.error("[SignalR] releaseEditSession error", err);
      throw err;
    }
  },

  /* =========================
       EVENTS
    ========================= */

  async onPresenceUpdated(callback) {
    const conn = await ensureConnection();

    presenceCallback = callback;

    conn.off("SectionPresenceUpdated");
    conn.on("SectionPresenceUpdated", callback);
  },

  async onLockUpdated(callback) {
    const conn = await ensureConnection();

    lockCallback = callback;

    conn.off("SectionLockUpdated");
    conn.on("SectionLockUpdated", callback);
  },

  offPresenceUpdated() {
    if (connection && presenceCallback) {
      connection.off("SectionPresenceUpdated", presenceCallback);
      presenceCallback = null;
    }
  },

  offLockUpdated() {
    if (connection && lockCallback) {
      connection.off("SectionLockUpdated", lockCallback);
      lockCallback = null;
    }
  },

  /* =========================
       UTILS
    ========================= */

  isConnected() {
    return connection?.state === signalR.HubConnectionState.Connected;
  },

  getConnection() {
    return connection;
  },

  async notifySectionUpdated(sectionId) {
    try {
      const conn = await ensureConnection();

      await conn.invoke("NotifySectionUpdated", sectionId);

      return true;
    } catch (err) {
      console.error("[SignalR] notifySectionUpdated error", err);
    }
  },
  //Listenr section update:
  async onSectionUpdated(callback) {
    const conn = await ensureConnection();

    sectionUpdatedCallback = callback;

    conn.off("SectionContentUpdated");

    conn.on("SectionContentUpdated", callback);
  },

  offSectionUpdated() {
    if (connection && sectionUpdatedCallback) {
      connection.off("SectionContentUpdated", sectionUpdatedCallback);

      sectionUpdatedCallback = null;
    }
  },
};
