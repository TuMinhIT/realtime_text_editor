import { useEffect } from "react";
import { signalRService } from "../../services/signalRService";

// Hook to register SignalR event listeners and clean them up on unmount
export function useSignalRListeners({ onPresence, onLock, onCursor, onSectionUpdated }) {
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        if (onPresence) await signalRService.onPresenceUpdated(onPresence);
        if (onLock) await signalRService.onLockUpdated(onLock);
        if (onCursor) await signalRService.onCursorUpdated(onCursor);
        if (onSectionUpdated) await signalRService.onSectionUpdated(onSectionUpdated);
      } catch (err) {
        console.error("[useSignalRListeners] setup error", err);
      }
    };

    setup();

    return () => {
      if (!mounted) return;
      if (onPresence) signalRService.offPresenceUpdated();
      if (onLock) signalRService.offLockUpdated();
      if (onCursor) signalRService.offCursorUpdated();
      if (onSectionUpdated) signalRService.offSectionUpdated();
      mounted = false;
    };
  }, [onPresence, onLock, onCursor, onSectionUpdated]);
}

export default useSignalRListeners;
