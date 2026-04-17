import React, { useState } from "react";
import { useDocumentStore } from "../store/useDocumentStore";
import { useCollaborationStore } from "../store/useCollaborationStore";
import { Users, MessageSquare } from "lucide-react";

const UserPresence = () => {
  const { document } = useDocumentStore();
  const { activeUsers, remoteCursors } = useCollaborationStore();
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Active Users Section */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} />
          <h3 className="font-bold">Active Users ({activeUsers.length})</h3>
        </div>

        <div className="space-y-3">
          {activeUsers.length === 0 ? (
            <p className="text-sm text-base-content/50">
              No other users online
            </p>
          ) : (
            activeUsers.map((user) => {
              const editingSection = document.sections.find(
                (s) => s.id === user.editingSection,
              );
              const cursor = remoteCursors[user.id];

              return (
                <div
                  key={user.id}
                  className="p-3 bg-base-300 rounded-lg hover:bg-base-300/80 transition"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-sm font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-base-content/60 truncate">
                        {user.email}
                      </p>
                      {editingSection && (
                        <div className="mt-2 p-2 bg-primary/20 rounded text-xs">
                          <p className="font-semibold text-primary">
                            Editing: {editingSection.title}
                          </p>
                          {cursor && (
                            <p className="text-primary/80">
                              Position: {cursor.position}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                      <span className="text-xs text-base-content/60">
                        {user.status || "Online"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section Assignment */}
      <div className="p-4 border-b border-base-300 flex-1 overflow-y-auto">
        <h4 className="font-bold text-sm mb-3">Section Access</h4>
        <div className="space-y-2">
          {document.sections.slice(0, 5).map((section) => {
            const assignedUsers = section.assignedUsers || [];
            return (
              <div key={section.id} className="p-2 bg-base-300 rounded-lg">
                <p className="text-xs font-semibold text-base-content/80">
                  {section.title}
                </p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {assignedUsers.length === 0 ? (
                    <span className="text-xs text-base-content/50 italic">
                      No one assigned
                    </span>
                  ) : (
                    assignedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="avatar placeholder"
                        title={user.email}
                      >
                        <div className="bg-secondary text-secondary-content rounded-full w-6 h-6 text-xs flex items-center justify-center">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comments Section */}
      <div className="p-4 border-t border-base-300">
        <button
          onClick={() => setShowComments(!showComments)}
          className="btn btn-sm btn-outline w-full gap-2"
        >
          <MessageSquare size={16} />
          Comments (0)
        </button>
        {showComments && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-base-300 rounded-lg">
              <textarea
                placeholder="Add a comment..."
                className="textarea textarea-sm textarea-bordered w-full h-20 resize-none"
              />
              <button className="btn btn-xs btn-primary mt-2 w-full">
                Post Comment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPresence;
