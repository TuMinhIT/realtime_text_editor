import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  CopyCheck,
  DeleteIcon,
  FileText,
  FolderOpen,
  UserCheck,
} from "lucide-react";
import { toast } from "react-toastify";
const FileItemUser = ({ doc }) => {
  const base = import.meta.env.VITE_API_URL || "";

  const getDownloadUrl = (doc) => {
    if (!doc) return "";
    return `${base}/prooffile/file/${doc.id}`;
  };

  const handleCopy = async (doc) => {
    try {
      const url = getDownloadUrl(doc);
      if (!url) return;
      await navigator.clipboard.writeText(url);
      toast.success("Copied link to clipboard.");
    } catch (err) {
      console.error(err);
      toast.error("Copy failed.");
    }
  };

  return (
    <div>
      <div key={doc.id} className=" p-2 text-slate-700 group relative">
        <div className="absolute gap-2 right-2 top-2 hidden items-center p-1 group-hover:flex">
          <button
            type="button"
            onClick={() => handleCopy(doc)}
            title="copy"
            className="p-1 text-blue-400 bg-white border border-slate-200 group-hover:flex hover:bg-blue-100"
          >
            <CopyCheck size={16} />
          </button>
        </div>

        <div className="border-b border-slate-100 ">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center text-blue-600">
              <FileText size={16} />
            </div>
            <div>
              <p className="font-medium text-slate-900">{doc.fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* <a
                    href={getDownloadUrl(doc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#1a73e8] hover:underline break-all"
                  >
                    link: ....file/{doc.id}
                  </a> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileItemUser;
