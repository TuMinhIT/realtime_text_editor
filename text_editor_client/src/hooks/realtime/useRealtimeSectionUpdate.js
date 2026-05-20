import { useCallback } from "react";
import { sessionService } from "../../services/sessionService";
import sectionService from "../../services/sectionService";


export default function useRealtimeSectionUpdate(
    {
        documentId,
        selectedSectionRef,
        isDirtyRef,
        setSections,
        setSelectedSection,
        loadPreview,
    }) {
    const onSectionUpdated = useCallback(async (data) => {
        const currentUserId = sessionService.getCurrentUser()?.id;
        if (data.userId === currentUserId) return;
        const currentSectionId = selectedSectionRef.current?.id;

        if (data.sectionId !== currentSectionId) return;
        // skip reload if editing
        if (isDirtyRef.current) return;

        try {
            const freshSections = await sectionService.getAllSectionsByDocument(documentId);
            setSections(freshSections);
            const updatedSection = freshSections.find((s) => s.id === currentSectionId);
            if (updatedSection) {
                setSelectedSection(updatedSection);
            }
        } catch (err) {
            console.error("[Realtime] onSectionUpdated handler error", err);
        }
    }, [documentId, selectedSectionRef, isDirtyRef, setSections, setSelectedSection]);

    return {
        onSectionUpdated,
    };
}