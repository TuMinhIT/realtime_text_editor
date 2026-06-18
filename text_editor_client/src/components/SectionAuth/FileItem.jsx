import {
  FileText,
  MoreVertical,
  Copy,
  Download,
  Trash2,
  PenBox,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import fileService from "../../services/fileService";

import React from "react";
import { toast } from "react-toastify";
import RenameForm from "./RenameForm";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatFileSize = (size) => {
  if (size === undefined || size === null) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const FileItem = ({ doc, loadFiles }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);
  const base = import.meta.env.VITE_API_URL || "";
  const [openRename, setOpenRename] = useState(false);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

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

  const getDownloadUrl = (doc) => {
    if (!doc) return "";
    return `${base}/prooffile/file/${doc.id}`;
  };

  const handleCopy = async (doc) => {
    try {
      const url = getDownloadUrl(doc);
      if (!url) return;
      await navigator.clipboard.writeText(url);
      toast.success("Đã copy link.");
    } catch (err) {
      console.error(err);
      toast.error("Copy thất bại.");
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

      toast.error("Xóa thất bại");
    }
  };

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
    <div className="group relative flex items-center gap-4 border-t border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50">
      {/* File Info */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <FileText size={20} />
        </div>

        <div className="min-w-0">
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
      </div>

      {/* Size */}
      <div className="hidden w-28 text-sm text-slate-500 md:block">
        {formatFileSize(doc.fileSize)}
      </div>

      {/* Created */}
      <div className="hidden w-32 text-sm text-slate-500 lg:block">
        {formatDate(doc.createdAt)}
      </div>

      {/* Menu */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpenMenu((v) => !v)}
          className={`rounded-full p-2 transition hover:bg-slate-200 ${
            openMenu ? "opacity-100" : "opacity-100"
          }`}
        >
          <MoreVertical size={18} />
        </button>

        {openMenu && (
          <div className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <button
              onClick={() => window.open(getDownloadUrl(doc), "_blank")}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
            >
              <Download size={16} />
              Download
            </button>

            <button
              onClick={() => {
                setNewName(doc.fileName);
                setIsRenaming(true);
                setOpenMenu(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-yellow-300 hover:bg-red-50"
            >
              <PenBox size={16} />
              Rename
            </button>

            <button
              onClick={() => handleCopy(doc)}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
            >
              <Copy size={16} />
              Copy Link
            </button>

            <button
              onClick={() => handleDelete(doc.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileItem;
