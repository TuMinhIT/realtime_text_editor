import { useEffect } from "react";
import { signalRService } from "../../services/signalRService";

export function useSignalRListeners({
  onPresence,
  onLock,
  onSectionUpdated,
}) {
  useEffect(() => {
    console.log("[SignalR Hook] Register listeners...");

    const register = async () => {
      try {
        // presence
        if (onPresence) {
          console.log("[SignalR Hook] attaching presence listener");
          signalRService.onPresenceUpdated((data) => {
            console.log("[SignalR][Presence]", data);
            onPresence(data);
          });
        }

        // lock
        if (onLock) {
          console.log("[SignalR Hook] attaching lock listener");
          signalRService.onLockUpdated((data) => {
            console.log("[SignalR][Lock]", data);
            onLock(data);
          });
        }

        // section update
        if (onSectionUpdated) {
          console.log("[SignalR Hook] attaching sectionUpdated listener");
          signalRService.onSectionUpdated((data) => {
            console.log("[SignalR][SectionUpdated RAW]", data);
            onSectionUpdated(data);
          });
        }

        console.log("[SignalR Hook] listeners registered OK");
      } catch (err) {
        console.error("[SignalR Hook] setup error:", err);
      }
    };

    register();

    return () => {
      console.log("[SignalR Hook] cleanup listeners");

      signalRService.offPresenceUpdated();
      signalRService.offLockUpdated();
      signalRService.offSectionUpdated();
    };
  }, [onPresence, onLock, onSectionUpdated]);
}

export default useSignalRListeners;