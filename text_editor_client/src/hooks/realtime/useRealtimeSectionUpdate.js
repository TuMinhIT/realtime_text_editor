import { useCallback, useRef } from "react";
import { sessionService } from "../../services/sessionService";
import sectionService from "../../services/sectionService";

const normalizeJson = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    return value;
  }
};

export default function useRealtimeSectionUpdate({
  selectedSectionRef,
  isDirtyRef,
  onContentReceived,
}) {
  const syncingRef = useRef(false);

  const onSectionUpdated = useCallback(
    async (data) => {
      try {
        const currentUserId = sessionService.getCurrentUser()?.id;
        const currentSectionId = selectedSectionRef.current?.id;

        console.log("[Realtime] SectionContentUpdated:", data);

        const updatedBy =
          data?.updatedBy ?? data?.updatedByUserId ?? data?.userId;

        if (updatedBy === currentUserId) {
          return;
        }

        if (data?.sectionId !== currentSectionId) {
          return;
        }

        if (isDirtyRef.current) {
          console.log(
            "[Realtime] Ignore update because local content is dirty",
          );
          return;
        }

        if (syncingRef.current) {
          console.log("[Realtime] Sync already in progress, skipping event");
          return;
        }

        syncingRef.current = true;
        try {
          const latest = await sectionService.getSectionbyId(
            currentSectionId,
            currentUserId,
          );

          const sfdt = normalizeJson(latest?.content);

          if (!sfdt) {
            console.log("[Realtime] no content returned from API");
            return;
          }

          onContentReceived?.({ sfdt, section: latest });
          console.log("[Realtime] Section synced");
        } finally {
          syncingRef.current = false;
        }
      } catch (err) {
        console.error("[Realtime] onSectionUpdated error", err);
      }
    },
    [selectedSectionRef, isDirtyRef, onContentReceived],
  );

  return {
    onSectionUpdated,
  };
}
