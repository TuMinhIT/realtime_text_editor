// Real-time sync service for SignalR integration
class RealtimeSyncService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.handlers = {};
    this.signalRUrl =
      import.meta.env.VITE_SIGNALR_URL || "http://localhost:5000/editHub";
  }

  /**
   * Initialize SignalR connection
   */
  async connect(documentId, userId, token) {
    try {
      // Lazy load SignalR library
      const signalR = await import("@microsoft/signalr");

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.signalRUrl, {
          accessTokenFactory: () => token,
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([0, 0, 1000, 3000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Register hub method handlers
      this.connection.on("ContentUpdated", (change) => {
        this.emit("content-updated", change);
      });

      this.connection.on("UserStatusChanged", (statusData) => {
        this.emit("user-status-updated", statusData);
      });

      this.connection.on("CursorMoved", (cursorData) => {
        this.emit("cursor-updated", cursorData);
      });

      this.connection.on("UserJoined", (user) => {
        this.emit("user-joined", user);
      });

      this.connection.on("UserLeft", (userId) => {
        this.emit("user-left", userId);
      });

      this.connection.on("SectionLocked", (sectionId) => {
        this.emit("section-locked", sectionId);
      });

      this.connection.on("SectionUnlocked", (sectionId) => {
        this.emit("section-unlocked", sectionId);
      });

      // Connection state handlers
      this.connection.onreconnected = () => {
        console.log("Reconnected to server");
        this.isConnected = true;
        this.emit("connected", { documentId, userId });
      };

      this.connection.onreconnecting = (error) => {
        console.log("Reconnecting to server...", error);
        this.emit("reconnecting", { error });
      };

      this.connection.onclose = (error) => {
        console.log("Disconnected from server");
        this.isConnected = false;
        this.emit("disconnected", { error });
      };

      // Start connection
      await this.connection.start();

      // Join document group
      await this.connection.invoke("JoinDocument", documentId, userId);

      this.isConnected = true;
      console.log(`Connected to document: ${documentId} as user: ${userId}`);
      this.emit("connected", { documentId, userId });

      return true;
    } catch (error) {
      console.error("Connection error:", error);
      this.isConnected = false;
      this.emit("error", error);
      return false;
    }
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  /**
   * Remove event handler
   */
  off(event, handler) {
    if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter((h) => h !== handler);
    }
  }

  /**
   * Emit event to all handlers
   */
  emit(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach((handler) => handler(data));
    }
  }

  /**
   * Send section content update
   */
  async sendContentUpdate(sectionId, content, userId) {
    if (!this.isConnected || !this.connection) {
      console.warn("Not connected to server");
      return false;
    }

    try {
      const change = {
        sectionId,
        content,
        userId,
        timestamp: new Date().toISOString(),
      };

      await this.connection.invoke("UpdateSectionContent", change);
      console.log("Content update sent:", change);
      return true;
    } catch (error) {
      console.error("Error sending content update:", error);
      this.emit("error", error);
      return false;
    }
  }

  /**
   * Send cursor position update
   */
  async sendCursorUpdate(sectionId, position, userId, userName) {
    if (!this.isConnected || !this.connection) {
      console.warn("Not connected to server");
      return false;
    }

    try {
      const cursorData = {
        sectionId,
        position,
        userId,
        userName,
        timestamp: new Date().toISOString(),
      };

      await this.connection.invoke("UpdateCursor", cursorData);
      console.log("Cursor update sent:", cursorData);
      return true;
    } catch (error) {
      console.error("Error sending cursor update:", error);
      return false;
    }
  }

  /**
   * Send user status update
   */
  async sendUserStatusUpdate(userId, userName, sectionId, status = "editing") {
    if (!this.isConnected || !this.connection) {
      console.warn("Not connected to server");
      return false;
    }

    try {
      const statusData = {
        userId,
        userName,
        sectionId,
        status,
        timestamp: new Date().toISOString(),
      };

      await this.connection.invoke("UpdateUserStatus", statusData);
      console.log("User status update sent:", statusData);
      return true;
    } catch (error) {
      console.error("Error sending user status update:", error);
      return false;
    }
  }

  /**
   * Request full document sync
   */
  async requestDocumentSync(documentId) {
    if (!this.isConnected || !this.connection) {
      console.warn("Not connected to server");
      return false;
    }

    try {
      await this.connection.invoke("RequestDocumentSync", documentId);
      console.log("Document sync requested for:", documentId);
      return true;
    } catch (error) {
      console.error("Error requesting document sync:", error);
      return false;
    }
  }

  /**
   * Disconnect from server
   */
  async disconnect() {
    try {
      if (this.connection) {
        // await this.connection.stop();
      }
      this.isConnected = false;
      this.emit("disconnected");
      console.log("Disconnected from sync service");
      return true;
    } catch (error) {
      console.error("Disconnect error:", error);
      return false;
    }
  }

  /**
   * Check connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionState: this.isConnected ? "connected" : "disconnected",
    };
  }
}

// Singleton instance
export const realtimeSyncService = new RealtimeSyncService();
