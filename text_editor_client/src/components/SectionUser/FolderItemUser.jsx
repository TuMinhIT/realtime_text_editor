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
  CopyCheck,
  Eye,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "../../utils/utilsFunction";
import React from "react";
import { toast } from "react-toastify";
import folderService from "../../services/folderService";
import { CgSpinner } from "react-icons/cg";
import FileItemUser from "./FileItemUser";
import { useNavigate } from "react-router-dom";
// import FileItem from "./FileItem";
const FolderItemUser = ({ folder, loadFolders, isEdit = false }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const base = import.meta.env.VITE_FE_API_URL || "";
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [loadFiles, setLoadFiles] = useState(false);
  const navigate = useNavigate();

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

  console.log(base);
  const getDownloadUrl = (doc) => {
    if (!doc) return "";
    return `${base}/folder/${doc.id}`;
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
          folder.id,
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
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    await handleUploadFiles(selectedFiles);
    document.removeEventListener("click", handleClickOutside);
    setExpanded(true);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoadFiles(true);
    try {
      const result = await folderService.getAllFileInFolder(folder.id);
      if (result.success) {
        setFiles(result.data);
      } else setFiles([]);
    } catch (err) {
      setFiles([]);
    } finally {
      setLoadFiles(false);
    }
  };

  return (
    <div className=" bg-white px-4 py-1 transition hover:bg-slate-50">
      <div className="group relative flex items-center  gap-4 ">
        {/* File Info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center  text-yellow-400">
            <Folder size={20} />
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{folder.name}</p>
          </div>
        </div>

        {/* Expand button */}

        <div className="absolute right-0 hidden items-center p-1 group-hover:flex">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded p-1 hover:bg-slate-200"
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          <button
            type="button"
            onClick={() => handleCopy(folder)}
            title="copy"
            className="p-1 text-blue-400 bg-white border border-slate-200 group-hover:flex hover:bg-blue-100"
          >
            <CopyCheck size={16} />
          </button>

          <button
            type="button"
            onClick={() => window.open(`/folder/${folder.id}`, "_blank")}
            title="view"
            className="p-1 text-blue-400 bg-white border border-slate-200 group-hover:flex hover:bg-blue-100"
          >
            <Eye size={16} />
          </button>

          <button
            type="button"
            onClick={() => handleDelete(folder.id)}
            title="delete"
            className="p-1 text-red-400 bg-white border border-slate-200 group-hover:flex hover:bg-red-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {loadFiles ? (
            <div>loading</div>
          ) : (
            files?.map((child) => (
              <div key={child.id} className="ml-8">
                <FileItemUser doc={child} isEdit={isEdit} />
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
};

export default FolderItemUser;
