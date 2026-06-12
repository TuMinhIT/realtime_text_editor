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
import InternalFileComponent from "./InternalFileComponent";
import FileItemUser from "./FileItemUser";
import folderService from "../../services/folderService";
import FolderItemUser from "./FolderItemUser";
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

const ProofFileTab = ({ documentId }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const base = import.meta.env.VITE_API_URL || "";
  const [folders, setFolders] = useState([]);
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
    loadFolders();
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

  const loadFolders = async () => {
    try {
      const result = await folderService.getAllFolder();
      setFolders(result.data);
    } catch (err) {
      setFolders([]);
      setErrorMessage(err?.message || "Không thể tải danh sách file.");
    }
  };

  return (
    <section className=" w-full rounded-xl bg-white ">
      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center flex-row gap-2.5">
          <span className="flex text-lg font-medium text-slate-900">
            File dùng chung
          </span>

          <span className=" flex text-sm text-slate-500">
            {files && files.length} files, {folders && folders.length} folders
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
          files.map((doc) => <FileItemUser key={doc.id} doc={doc} />)
        ) : null}

        {/* folders */}
        <div>
          {folders && folders.length
            ? folders.map((folder) => (
                <FolderItemUser
                  key={folder.id}
                  folder={folder}
                  loadFolders={loadFolders}
                />
              ))
            : null}
        </div>
      </div>

      {/* // internal file */}
      <InternalFileComponent documentId={documentId} />
    </section>
  );
};

export default ProofFileTab;
