import {
  FileText,
  MoreVertical,
  Copy,
  Download,
  Trash2,
  Folder,
  ChevronDown,
  ChevronRight,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "../../utils/utilsFunction";
import React from "react";
import { toast } from "react-toastify";
import folderService from "../../services/folderService";

const FolderItem = ({ doc, loadFolders }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const base = import.meta.env.VITE_API_URL || "";
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

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

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Bạn có chắc muốn xóa file này?");

    if (!isConfirmed) return;

    try {
      await folderService.deleteFolder(id);

      toast.success("Đã xóa file.");
      await loadFolders();
    } catch (err) {
      console.error(err);

      toast.error("Xóa thất bại");
    }
  };

  const getDownloadUrl = (doc) => {
    if (!doc) return "";
    return `${base}/ProofFolder/${doc.id}`;
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

  const handleUploadFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }
    try {
      for (const file of selectedFiles) {
        const uploadResponse = await folderService.uploadFileToFolder(
          file,
          file.id,
        );
      }
      toast.success("Upload file thành công.");
      await loadFolders();
    } catch (err) {
      console.error(err);
      toast.error("Upload thất bại");
    }
  };

  const handleFileChange = async (event) => {
    toast.success("ok upload lên");
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    await handleUploadFiles(selectedFiles);
    document.removeEventListener("click", handleClickOutside);
    setExpanded(true);
  };

  const hasChildren = true;
  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className=" group relative flex items-center gap-4 border-t border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50"
    >
      {/* File Info */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-800">
          <Folder size={20} />
        </div>

        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{doc.name}</p>
        </div>
      </div>

      {/* Expand button */}
      <div className="w-24">
        {hasChildren ? (
          <button className="rounded p-1 hover:bg-slate-200">
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        ) : null}
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
            openMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <MoreVertical size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {openMenu && (
          <div className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
            >
              <Upload size={16} />
              Upload file
            </button>

            <button
              onClick={() => window.open(getDownloadUrl(doc), "_blank")}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
            >
              <Download size={16} />
              Download
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

      {/* Children
      {expanded &&
        doc.children?.map((child) => (
          <FileItem
            key={child.id}
            doc={child}
            level={level + 1}
            handleCopy={handleCopy}
            handleDelete={handleDelete}
            getDownloadUrl={getDownloadUrl}
          />
        ))} */}
    </div>
  );
};

export default FolderItem;
