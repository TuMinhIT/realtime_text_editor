import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock3,
  Copy,
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

const ProofFileSection = () => {
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
    const result = await fileService.getAllFiles();
    if (result) {
      setFiles(result.data);
    }
    setIsLoading(false);
  };

  // mới dô load data lên đi
  useEffect(() => {
    loadFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    if (!keyword.trim()) {
      return files;
    }

    const normalizedKeyword = keyword.toLowerCase();
    return files.filter((doc) => {
      return (doc.fileName || "").toLowerCase().includes(normalizedKeyword);
    });
  }, [files, keyword]);

  const formatFileSize = (size) => {
    if (size === undefined || size === null) return "-";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setErrorMessage("");
    try {
      const res = await fileService.uploadFile(file, true);
      toast.success("Upload thành công.");
      await loadFiles();
    } catch (err) {
      // console.error(err);
      toast.error("Upload thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleUpload(file);
    event.target.value = "";
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
    <section className="mt-4 rounded-2xl bg-white p-3 md:p-6">
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center flex-row gap-2.5">
          <span className="flex text-lg font-medium text-slate-900">
            Proof file
          </span>

          <span className=" flex text-sm text-slate-500">
            {filteredFiles && filteredFiles.length} files
          </span>
        </div>
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
                <CgAdd size={25} />
              </div>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="border-b border-slate-200 px-4 py-3 font-medium">
                File
              </th>

              <th className="border-b border-slate-200 px-4 py-3 font-medium">
                Size
              </th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">
                Created
              </th>
              <th className="border-b border-slate-200 px-4 py-3 font-medium">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="border-b border-slate-100 px-4 py-8 text-center text-sm text-slate-500"
                >
                  Dang tai danh sach tai lieu...
                </td>
              </tr>
            ) : filteredFiles && filteredFiles.length ? (
              filteredFiles.map((doc) => (
                <tr
                  key={doc.id}
                  className="text-sm text-slate-700 hover:bg-[#f8fafc]"
                >
                  <td className="border-b border-slate-100 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8]">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {doc.fileName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={getDownloadUrl(doc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#1a73e8] hover:underline break-all"
                      >
                        link: ....file/{doc.id}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(doc)}
                        className="inline-flex items-center gap-2 rounded px-2 py-1 border border-slate-300 text-sm font-medium transition hover:bg-slate-100"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                  </td>

                  <td className="border-b border-slate-100 px-4 py-4">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 size={14} />
                      {formatDate(doc.createdAt)}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 px-4 py-4">
                    <button
                      type="button"
                      onClick={() => window.open(getDownloadUrl(doc), "_blank")}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:border-[#1a73e8] hover:text-[#1a73e8]"
                    >
                      <DownloadCloud size={15} />
                      download
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-red-400"
                    >
                      <DeleteIcon size={15} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="border-b border-slate-100 px-4 py-8 text-center text-sm text-slate-500"
                >
                  Chua co tai lieu nao. Hay upload file `.docx` dau tien.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ProofFileSection;
