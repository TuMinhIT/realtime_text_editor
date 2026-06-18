import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  CopyCheck,
  DeleteIcon,
  FileText,
  FolderOpen,
  PenBox,
  UserCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import fileService from "../../services/fileService";
const FileItemUser = ({ doc, isEdit = false, loadFiles }) => {
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

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Bạn có chắc muốn xóa file này?");
    if (!isConfirmed) return;
    try {
      await fileService.deleteFile(id);
      toast.success("Đã xóa file.");
      await loadFiles();
    } catch (err) {
      console.error(err);
      setErrorMessage(err?.message || "Xóa thất bại.");
      toast.error("Xóa thất bại");
    }
  };

  const [isRenaming, setIsRenaming] = useState(false);
  const [fileName, setFileName] = useState(doc.fileName);
  const [newName, setNewName] = useState(doc.fileName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const handleRename = async (newName) => {
    const isConfirmed = window.confirm("Bạn có chắc muốn đổi tên file này?");

    if (!isConfirmed) return;
    try {
      await fileService.renameFile(doc.id, newName);
      setFileName(newName);
      // await loadFiles();/
    } catch (err) {
      console.error(err);
      toast.error("Đổi tên thất bại");
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
          {isEdit && (
            <>
              <button
                onClick={() => {
                  setNewName(fileName);
                  setIsRenaming(true);
                }}
                className="p-1 text-yellow-300 bg-white border border-slate-200 group-hover:flex hover:bg-red-50"
              >
                <PenBox size={16} />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                title="Xóa"
                className=" p-1 text-red-600 bg-white border border-slate-200 group-hover:flex hover:bg-red-50"
              >
                <DeleteIcon size={16} />
              </button>
            </>
          )}
        </div>

        <div className="border-b border-slate-100 ">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center text-blue-600">
              <FileText size={16} />
            </div>
            {isRenaming ? (
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={async () => {
                  if (newName.trim() && newName !== fileName) {
                    setIsRenaming(false);
                    await handleRename(newName);
                  }
                  setIsRenaming(false);
                }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    if (newName.trim() && newName !== fileName) {
                      await handleRename(newName);
                    }
                    setIsRenaming(false);
                  }

                  if (e.key === "Escape") {
                    setNewName(fileName);
                    setIsRenaming(false);
                  }
                }}
                className="w-full rounded border border-blue-400 px-2 py-1 text-sm"
              />
            ) : (
              <p className="truncate font-medium text-slate-900">{fileName}</p>
            )}
          </div>

          <div className="flex items-center gap-3"></div>
        </div>
      </div>
    </div>
  );
};

export default FileItemUser;
