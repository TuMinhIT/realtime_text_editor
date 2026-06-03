import { useCallback } from "react";
import { sessionService } from "../../services/sessionService";
import sectionService from "../../services/sectionService";

export default function useRealtimeSectionUpdate({
  documentId,
  selectedSectionRef,
  isDirtyRef,
  setSections,
}) {
  const onSectionUpdated = useCallback(
    async (data) => {
      const currentUserId = sessionService.getCurrentUser()?.id;

      // bỏ event của chính mình
      if (data.userId === currentUserId) {
        return;
      }

      const currentSectionId = selectedSectionRef.current?.id;

      // section khác -> ignore
      if (data.sectionId !== currentSectionId) {
        return;
      }

      // đang edit -> ignore
      if (isDirtyRef.current) {
        return;
      }

      try {
        // const freshSections =
        //   await sectionService.getAllSectionsByDocument(documentId);

        // setSections(freshSections);

        console.log("[Realtime] section synced");
      } catch (err) {
        console.error("[Realtime] onSectionUpdated error", err);
      }
    },
    [documentId, selectedSectionRef, isDirtyRef, setSections],
  );

  return {
    onSectionUpdated,
  };
}
