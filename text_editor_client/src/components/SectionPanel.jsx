import React from "react";
import { useDocumentStore } from "../store/useDocumentStore";
import { useCollaborationStore } from "../store/useCollaborationStore";
import { ChevronDown, Users } from "lucide-react";

const SectionPanel = () => {
  const { document, activeSection, setActiveSection, canEditSection } =
    useDocumentStore();
  const { activeUsers } = useCollaborationStore();

  const getEditingUsersForSection = (sectionId) => {
    return activeUsers.filter((u) => u.editingSection === sectionId);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Sections</h2>
      <div className="space-y-2">
        {document.sections.map((section) => {
          const editingUsers = getEditingUsersForSection(section.id);
          const canEdit = canEditSection(section.id);
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                isActive
                  ? "bg-primary text-primary-content shadow-md"
                  : "bg-base-300 hover:bg-base-300/80"
              } ${!canEdit && "opacity-60"}`}
              disabled={!canEdit}
              title={
                !canEdit
                  ? "You do not have permission to edit this section"
                  : ""
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {section.title}
                  </h3>
                  <p className="text-xs opacity-75 truncate">
                    {section.content?.substring(0, 50)}...
                  </p>
                </div>
                {!canEdit && (
                  <span className="badge badge-sm badge-error shrink-0">
                    Locked
                  </span>
                )}
              </div>

              {/* Editing Users Indicator */}
              {editingUsers.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <Users size={14} />
                  <div className="flex gap-1">
                    {editingUsers.map((user) => (
                      <div
                        key={user.id}
                        className="avatar placeholder"
                        title={user.name}
                      >
                        <div className="bg-primary text-primary-content rounded-full w-6 h-6 text-xs flex items-center justify-center">
                          <span>{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Statistics */}
      <div className="mt-8 pt-4 border-t border-base-300">
        <h3 className="text-sm font-semibold mb-3">Statistics</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Total Sections:</span>
            <span className="font-bold">{document.sections.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Words:</span>
            <span className="font-bold">
              {document.sections.reduce(
                (acc, s) => acc + (s.content?.split(" ").length || 0),
                0,
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Active Users:</span>
            <span className="font-bold">{activeUsers.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionPanel;
