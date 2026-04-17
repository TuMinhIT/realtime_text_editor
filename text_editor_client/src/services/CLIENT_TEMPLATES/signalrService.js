// services/signalrService.js
import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect(token, serverUrl = "https://localhost:5001") {
    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${serverUrl}/hubs/document`, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect([0, 0, 0, 1000, 3000, 5000])
        .withHubProtocol(new signalR.JsonHubProtocol())
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Connection events
      this.connection.onreconnecting((error) => {
        console.log("Reconnecting...", error);
        this.isConnected = false;
      });

      this.connection.onreconnected((connectionId) => {
        console.log("Reconnected:", connectionId);
        this.isConnected = true;
      });

      this.connection.onclose(async (error) => {
        console.log("Connection closed:", error);
        this.isConnected = false;
      });

      await this.connection.start();
      this.isConnected = true;
      console.log("✓ Connected to SignalR");
      return true;
    } catch (err) {
      console.error("❌ SignalR connection failed:", err);
      return false;
    }
  }

  disconnect() {
    if (this.connection) {
      this.connection.stop();
      this.isConnected = false;
    }
  }

  // Section operations
  joinSection(sectionId, userId) {
    return this.connection.invoke("JoinSection", sectionId, userId);
  }

  leaveSection(sectionId, userId) {
    return this.connection.invoke("LeaveSection", sectionId, userId);
  }

  sendChange(
    sectionId,
    userId,
    operationType,
    text,
    position,
    length,
    versionBefore,
  ) {
    return this.connection.invoke(
      "SendChange",
      sectionId,
      userId,
      operationType,
      text,
      position,
      length,
      versionBefore,
    );
  }

  getChangeHistory(sectionId, fromVersion) {
    return this.connection.invoke("GetChangeHistory", sectionId, fromVersion);
  }

  // Event listeners
  onLoadSection(callback) {
    this.connection.on("LoadSection", callback);
  }

  onReceiveChange(callback) {
    this.connection.on("ReceiveChange", callback);
  }

  onUserJoined(callback) {
    this.connection.on("UserJoined", callback);
  }

  onUserLeft(callback) {
    this.connection.on("UserLeft", callback);
  }

  onChangeHistory(callback) {
    this.connection.on("ChangeHistory", callback);
  }

  onError(callback) {
    this.connection.on("Error", callback);
  }

  // Cleanup
  offLoadSection() {
    this.connection.off("LoadSection");
  }

  offReceiveChange() {
    this.connection.off("ReceiveChange");
  }

  offUserJoined() {
    this.connection.off("UserJoined");
  }

  offUserLeft() {
    this.connection.off("UserLeft");
  }

  offChangeHistory() {
    this.connection.off("ChangeHistory");
  }

  offError() {
    this.connection.off("Error");
  }
}

export default new SignalRService();
