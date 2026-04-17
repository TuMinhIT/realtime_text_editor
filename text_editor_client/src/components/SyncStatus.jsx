import React, { useEffect, useState } from "react";
import { useCollaborationStore } from "../store/useCollaborationStore";
import { realtimeSyncService } from "../services/realtimeSyncService";
import { Cloud, CloudOff, AlertCircle, Wifi } from "lucide-react";

const SyncStatus = () => {
  const { syncStatus, pendingChanges } = useCollaborationStore();
  const [connectionStatus, setConnectionStatus] = useState("connected");

  useEffect(() => {
    // Listen to sync events
    const handleConnected = () => setConnectionStatus("connected");
    const handleDisconnected = () => setConnectionStatus("disconnected");
    const handleError = () => setConnectionStatus("error");

    realtimeSyncService.on("connected", handleConnected);
    realtimeSyncService.on("disconnected", handleDisconnected);
    realtimeSyncService.on("error", handleError);

    // Check initial status
    const status = realtimeSyncService.getStatus();
    setConnectionStatus(status.isConnected ? "connected" : "disconnected");

    return () => {
      realtimeSyncService.off("connected", handleConnected);
      realtimeSyncService.off("disconnected", handleDisconnected);
      realtimeSyncService.off("error", handleError);
    };
  }, []);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          icon: <Cloud size={16} className="animate-pulse" />,
          text: "Connected",
          color: "success",
          badge: "badge-success",
        };
      case "syncing":
        return {
          icon: <Wifi size={16} className="animate-spin" />,
          text: "Syncing...",
          color: "info",
          badge: "badge-info",
        };
      case "error":
        return {
          icon: <AlertCircle size={16} />,
          text: "Connection Error",
          color: "error",
          badge: "badge-error",
        };
      case "disconnected":
        return {
          icon: <CloudOff size={16} />,
          text: "Disconnected",
          color: "warning",
          badge: "badge-warning",
        };
      default:
        return {
          icon: <Cloud size={16} />,
          text: "Unknown",
          color: "base",
          badge: "badge-neutral",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center justify-between">
      {/* Status Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className={`badge ${config.badge}`}>{config.text}</span>
        </div>

        {/* Pending Changes */}
        {pendingChanges.length > 0 && (
          <div className="badge badge-outline gap-1">
            <span className="w-2 h-2 bg-warning rounded-full animate-pulse"></span>
            {pendingChanges.length} pending
          </div>
        )}
      </div>

      {/* Auto-sync Info */}
      <div className="text-xs text-base-content/60">
        {connectionStatus === "connected"
          ? "Auto-syncing enabled"
          : "Check your connection"}
      </div>
    </div>
  );
};

export default SyncStatus;
