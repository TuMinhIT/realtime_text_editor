import { useCallback, useRef } from "react";
import { sessionService } from "../../services/sessionService";
import sectionService from "../../services/sectionService";

/* =========================
   SAFE NORMALIZER
========================= */
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

// Hàm chuyển đổi
const normalizeContentForEditor = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export default function useRealtimeSectionUpdate({
  documentId,
  selectedSectionRef,
  isDirtyRef,
  onContentReceived,
  setSections,
}) {
  const syncingRef = useRef(false);
  const debounceRef = useRef(null);

  /* =========================
     HANDLE REALTIME EVENT
  ========================= */
  const onSectionUpdated = useCallback(
    (data) => {
      // console.log("================================");
      // console.log("[Realtime] EVENT RECEIVED:", data);

      // debounce burst events
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        await syncSection(data);
      }, 150);
    },
    [documentId, selectedSectionRef, isDirtyRef, onContentReceived, setSections]
  );

  /* =========================
     CORE SYNC LOGIC
  ========================= */
  const syncSection = async (data) => {
    try {
      const currentUserId = sessionService.getCurrentUser()?.id;
      const currentSectionId = selectedSectionRef.current?.id;

      //console.log("[Realtime] syncing...");

      // 1. ignore self update
      if (data?.updatedByUserId === currentUserId) {
        //console.log("[Realtime] ignore self update");
        return;
      }

      // 2. wrong section
      if (data?.sectionId !== currentSectionId) {
        //console.log("[Realtime] ignore different section");
        return;
      }

      // 3. user is editing locally
      if (isDirtyRef.current) {
        //console.log("[Realtime] ignore dirty state");
        return;
      }

      // 4. prevent parallel sync
      if (syncingRef.current) {
        //console.log("[Realtime] ignore duplicate sync");
        return;
      }

      syncingRef.current = true;

      //console.log("[Realtime] FETCH FROM DB ONLY");

      const latest = await sectionService.getSectionbyId(
        data.sectionId,
        currentUserId
      );

      if (!latest?.content) {
        //console.log("[Realtime] empty response");
        return;
      }

      let sfdt = normalizeContentForEditor(latest.content);

      if (documentId) {
        try {
          const preview = await sectionService.previewSection(
            latest.id,
            normalizeJson(latest.content),
            documentId,
          );

          if (preview?.sfdtContent) {
            sfdt = normalizeContentForEditor(preview.sfdtContent);
          }
        } catch (previewError) {
          console.warn("[Realtime] preview fallback failed", previewError);
        }
      }

      if (!sfdt) {
        //console.log("[Realtime] no valid SFDT to apply");
        return;
      }

      //console.log("[Realtime] APPLY UPDATE TO UI");

      onContentReceived?.({
        sfdt,
        section: latest,
      });

      // refresh sidebar
      const freshSections =
        await sectionService.getAllSectionsByDocument(documentId);

      setSections(freshSections);

      //console.log("[Realtime] SYNC DONE");
    } catch (err) {
      console.error("[Realtime] ERROR:", err);
    } finally {
      syncingRef.current = false;
      //console.log("================================");
    }
  };

  return { onSectionUpdated };
}