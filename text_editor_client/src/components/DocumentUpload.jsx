import React, { useRef } from "react";
import { Upload, File } from "lucide-react";

const DocumentUpload = ({ onUpload, isLoading }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (
        !file.name.endsWith(".docx") &&
        !file.name.endsWith(".doc") &&
        !file.name.endsWith(".txt")
      ) {
        alert("Please select a valid document file (.docx, .doc, or .txt)");
        return;
      }

      onUpload(file);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="card bg-base-100 border border-dashed border-base-300">
      <div className="card-body items-center text-center">
        <File className="text-primary mb-4" size={32} />
        <h2 className="card-title text-lg">Upload Document</h2>
        <p className="text-base-content/60 mb-4">
          Drag and drop your Word document or click to browse
        </p>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".docx,.doc,.txt"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-primary gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Processing...
            </>
          ) : (
            <>
              <Upload size={18} />
              Choose File
            </>
          )}
        </button>

        <p className="text-xs text-base-content/50 mt-4">
          Supported formats: .docx, .doc, .txt (Max 10MB)
        </p>
      </div>
    </div>
  );
};

export default DocumentUpload;
