import { useEffect } from "react";
import { signalRService } from "../../services/signalRService";

export function useSectionJoin(sectionId) {
  useEffect(() => {
    if (!sectionId) return;
    let mounted = true;
    const join = async () => {
      try {
        await signalRService.joinSection(sectionId);
        // joined
      } catch (err) {
        console.error("[useSectionJoin] join error", err);
      }
    };
    join();

    return () => {
      if (!mounted) return;
      (async () => {
        try {
          await signalRService.releaseEditSession(sectionId);
        } catch (err) {
          // ignore release errors on cleanup
        }

        try {
          await signalRService.leaveCurrentSection();
        } catch (err) {
          // ignore leave errors on cleanup
        }
      })();
      mounted = false;
    };
  }, [sectionId]);
}

export default useSectionJoin;
