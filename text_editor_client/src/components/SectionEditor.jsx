import React, { useEffect, useState } from "react";
import { useDocumentStore } from "../store/useDocumentStore";
import { useCollaborationStore } from "../store/useCollaborationStore";
import { realtimeSyncService } from "../services/realtimeSyncService";
import { sectionService } from "../services/sectionService";
import { Clock, Lock } from "lucide-react";

const SectionEditor = () => {
  const {
    activeSection,
    document,
    updateSectionContent,
    canEditSection,
    currentUser,
  } = useDocumentStore();

  const { addPendingChange, updateUserEditingSection } =
    useCollaborationStore();

  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveError, setSaveError] = useState("");

  const section = document.sections.find((s) => s.id === activeSection);
  const canEdit = section && canEditSection(section.id);

  useEffect(() => {
    if (section) {
      setContent(section.content || "");
      setSaveError("");
    }
  }, [section]);

  useEffect(() => {
    if (canEdit && activeSection && currentUser.id) {
      updateUserEditingSection(currentUser.id, activeSection);
      realtimeSyncService.sendUserStatusUpdate(
        currentUser.id,
        currentUser.name,
        activeSection,
        "editing",
      );
    }
  }, [
    activeSection,
    canEdit,
    currentUser.id,
    currentUser.name,
    updateUserEditingSection,
  ]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setSaveError("");

    addPendingChange({
      sectionId: activeSection,
      content: newContent,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSave = async () => {
    if (!section || !canEdit) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const updatedSection = await sectionService.updateSectionContent(
        activeSection,
        content,
      );

      updateSectionContent(activeSection, updatedSection.content ?? content);

      await realtimeSyncService.sendContentUpdate(
        activeSection,
        content,
        currentUser.id,
      );

      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving content:", error);
      setSaveError(error.message || "Failed to save section.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-base-content/50">No section selected</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="alert alert-warning gap-4">
          <Lock size={24} />
          <div>
            <h3 className="font-bold">Read-only section</h3>
            <p className="text-sm">
              You can still review the content, but you do not currently have
              permission to edit this section.
            </p>
          </div>
        </div>
        <div className="mt-8 p-6 bg-base-200 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
          <div className="prose max-w-none whitespace-pre-wrap">
            <p>{section.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-base-300 p-4 bg-base-100">
        <h2 className="text-2xl font-bold mb-2">{section.title}</h2>
        <div className="flex items-center justify-between text-xs text-base-content/60">
          <span>Section ID: {section.id}</span>
          {lastSaved && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              Saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Start typing your content here..."
          className="textarea textarea-bordered flex-1 font-mono resize-none focus:outline-none focus:border-primary"
          disabled={!canEdit}
        />

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-sm text-base-content/60">
            {content.split(" ").filter(Boolean).length} words · {content.length} characters
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || !canEdit}
            className="btn btn-primary btn-sm gap-2"
          >
            {isSaving && (
              <span className="loading loading-spinner loading-sm"></span>
            )}
            Save Changes
          </button>
        </div>

        {saveError && (
          <div className="alert alert-error mt-4">
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {section.assignedUsers && section.assignedUsers.length > 0 && (
        <div className="border-t border-base-300 p-4 bg-base-200">
          <p className="text-xs font-semibold mb-2">Assigned Users:</p>
          <div className="flex flex-wrap gap-2">
            {section.assignedUsers.map((user) => (
              <div key={user.id} className="badge badge-primary gap-2">
                <div className="avatar placeholder">
                  <div className="bg-primary-focus text-primary-content rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                </div>
                {user.email}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionEditor;
