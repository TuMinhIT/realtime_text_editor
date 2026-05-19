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

const ProofFileTab = () => {
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

  const formatFileSize = (size) => {
    if (size === undefined || size === null) return "-";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleUpload(file);
    event.target.value = "";
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
    <section className=" rounded-xl bg-white ">
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center flex-row gap-2.5">
          <span className="flex text-lg font-medium text-slate-900">
            Global file
          </span>

          <span className=" flex text-sm text-slate-500">
            {files && files.length} files
          </span>
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
            <div
              key={doc.id}
              className="text-sm text-slate-700 hover:bg-[#f8fafc]"
            >
              <div className="border-b border-slate-100 px-2 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8]">
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
                  <button
                    type="button"
                    onClick={() => handleCopy(doc)}
                    className="inline-flex items-center gap-2 rounded px-2 py-1 border border-slate-300 text-sm font-medium transition hover:bg-slate-100"
                  >
                    <Copy size={14} />
                    Copy link
                  </button>
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

      {/* // internal file */}

      <div className="flex flex-row items-center justify-between mt-5">
        <div className="flex items-center flex-row gap-2.5">
          <span className="flex text-lg font-medium text-slate-900">
            Internal file
          </span>

          <span className=" flex text-sm text-slate-500">
            {files && files.length} files
          </span>
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
            <div
              key={doc.id}
              className="text-sm text-slate-700 hover:bg-[#f8fafc]"
            >
              <div className="border-b border-slate-100 px-2 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8]">
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
                  <button
                    type="button"
                    onClick={() => handleCopy(doc)}
                    className="inline-flex items-center gap-2 rounded px-2 py-1 border border-slate-300 text-sm font-medium transition hover:bg-slate-100"
                  >
                    <Copy size={14} />
                    Copy link
                  </button>
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
    </section>
  );
};

export default ProofFileTab;
