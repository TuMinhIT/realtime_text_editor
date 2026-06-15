import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock3,
  Copy,
  CopyCheck,
  DeleteIcon,
  Download,
  DownloadCloud,
  FileText,
  FolderOpen,
  MoveDiagonal2,
  Plus,
  Upload,
  UserCheck,
} from "lucide-react";

import fileService from "../../services/fileService";
import { CgAdd, CgSpinner } from "react-icons/cg";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import { SiAuthelia } from "react-icons/si";

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

const InternalFileComponent = ({ documentId }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const base = import.meta.env.VITE_API_URL || "";

  const loadFiles = async () => {
    setIsLoading(true);
    setErrorMessage("");
    const result = await fileService.getAllInternalFiles(documentId);
    if (result) {
      setFiles(result.data);
    }
    setIsLoading(false);
  };

  // mới dô load data lên đi
  useEffect(() => {
    loadFiles();
  }, []);

  const formatFileSize = (size) => {
    if (size === undefined || size === null) return "-";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    await handleUploadFiles(selectedFiles);
  };

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

  const handleUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setErrorMessage("");
    try {
      const res = await fileService.uploadByUser(file, documentId);
      toast.success("Upload thành công.");
      await loadFiles();
    } catch (err) {
      toast.error("Upload thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }
    try {
      for (const file of selectedFiles) {
        await fileService.uploadByUser(file, documentId);
      }
      toast.success("Upload file thành công.");
      await loadFiles();
    } catch (err) {
      console.error(err);
      toast.error("Upload thất bại"); 
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

  return (
    <>
      <div className="flex flex-row items-center justify-between mt-5">
        <div className="flex items-center flex-row gap-2.5">
          <span className="flex text-lg font-medium text-slate-900">
            File nọi bộ
          </span>

          <span className=" flex text-sm text-slate-500">
            {files && files.length} files
          </span>

          <div className="flex ">
            {isUploading ? (
              <ClipLoader color="red" />
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl  bg-white transition hover:border-[#1a73e8] hover:shadow-sm"
                disabled={isUploading}
              >
                <div className="flex p-2  items-center justify-center rounded-xl bg-[#e8f0fe] text-[#1a73e8]">
                  <CgAdd size={18} />
                </div>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto">
        {isLoading ? (
          <div>
            <div
              colSpan={5}
              className="border-b border-slate-100 px-4 py-8 text-center text-sm text-slate-500"
            >
              Dang tai danh sach tai lieu...
            </div>
          </div>
        ) : files && files.length ? (
          files.map((doc) => (
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

                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  title="Xóa"
                  className=" p-1 text-red-600 bg-white border border-slate-200 group-hover:flex hover:bg-red-50"
                >
                  <DeleteIcon size={16} />
                </button>
              </div>

              <div className="border-b border-slate-100 px-2 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center text-blue-600">
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
          ))
        ) : (
          <div>
            <div
              colSpan={5}
              className="border-b border-slate-100 px-4 py-8 text-center text-sm text-slate-500"
            >
              Chua co tai lieu nao. Hay upload file `.docx` dau tien.
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InternalFileComponent;
