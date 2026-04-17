import React, { useState } from "react";
import { useDocumentStore } from "../store/useDocumentStore";
import { Save, Download, Share2 } from "lucide-react";

const DocumentHeader = () => {
  const { document, updateDocumentTitle } = useDocumentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(document.title);

  const handleTitleChange = () => {
    if (title.trim()) {
      updateDocumentTitle(title);
    }
    setIsEditing(false);
  };

  return (
    <div className="p-4 flex items-center justify-between">
      {/* Title Section */}
      <div className="flex-1 flex items-center gap-3">
        <div>
          {isEditing ? (
            <input
              type="text"
              className="input input-bordered input-sm max-w-xs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleChange();
                if (e.key === "Escape") setIsEditing(false);
              }}
              autoFocus
            />
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer hover:text-primary"
              onClick={() => setIsEditing(true)}
            >
              {document.title || "Untitled Document"}
            </h1>
          )}
          <p className="text-sm text-base-content/50">
            Last updated: {new Date(document.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button className="btn btn-sm btn-ghost gap-2" title="Save document">
          <Save size={18} />
          Save
        </button>
        <button
          className="btn btn-sm btn-ghost gap-2"
          title="Download as .docx"
        >
          <Download size={18} />
          Download
        </button>
        <button className="btn btn-sm btn-primary gap-2" title="Share document">
          <Share2 size={18} />
          Share
        </button>
      </div>
    </div>
  );
};

export default DocumentHeader;
