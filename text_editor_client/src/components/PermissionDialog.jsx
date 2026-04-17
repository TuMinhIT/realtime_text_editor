import React, { useState } from "react";
import { useDocumentStore } from "../store/useDocumentStore";
import { X, Plus, Trash2 } from "lucide-react";

const PermissionDialog = ({ isOpen, onClose, sectionId }) => {
  const { document, assignUserToSection, removeUserFromSection } =
    useDocumentStore();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const section = document.sections.find((s) => s.id === sectionId);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!email.trim() || !section) return;

    setIsLoading(true);
    try {
      // Simulate API call to get user ID
      const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
      assignUserToSection(section.id, userId, email);
      setEmail("");
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !section) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <h2 className="text-lg font-bold">Manage Access</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-semibold mb-4">{section.title}</h3>

          {/* Current Permissions */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3">
              Current Permissions
            </label>
            {section.assignedUsers && section.assignedUsers.length > 0 ? (
              <div className="space-y-2">
                {section.assignedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-base-200 rounded"
                  >
                    <span className="text-sm">{user.email}</span>
                    <button
                      onClick={() => removeUserFromSection(section.id, user.id)}
                      className="btn btn-ghost btn-xs"
                      title="Remove user"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-base-content/50 italic">
                No users assigned yet
              </p>
            )}
          </div>

          {/* Add User Form */}
          <form onSubmit={handleAddUser} className="space-y-3">
            <label className="block text-sm font-semibold">Add User</label>
            <div className="flex gap-2">
              <input
                type="email"
                className="input input-bordered input-sm flex-1"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm gap-2"
                disabled={isLoading || !email.trim()}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </form>

          {/* Public Access Toggle */}
          <div className="mt-6 pt-6 border-t border-base-300">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="checkbox checkbox-sm" />
              <span className="text-sm">
                Make section public (anyone can view)
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-base-300">
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            Cancel
          </button>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionDialog;
