import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  ChevronRight,
  Copy,
  FileText,
  FolderOpen,
  FolderPlus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import fileService from "../../services/fileService";
import folderService from "../../services/folderService";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import FileItem from "./FileItem";
import FolderItem from "./FolderItem";

const ROOT_FOLDER_ID = "__root__";
const STORAGE_KEY = "proof-file-section-folder-state-v1";

const normalizeResponseData = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const splitRelativePath = (file) => {
  const relativePath = file?.webkitRelativePath || file?.name || "";
  const segments = relativePath.split("/").filter(Boolean);
  const fileName = segments[segments.length - 1] || file?.name || "";

  return {
    relativePath,
    fileName,
    folderSegments: segments.length > 1 ? segments.slice(0, -1) : [],
  };
};

const ProofFileSection = () => {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);

  const [selectedFolderId, setSelectedFolderId] = useState(ROOT_FOLDER_ID);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const base = import.meta.env.VITE_API_URL || "";

  const loadFiles = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await fileService.getAllFiles();
      if (result.success) {
        setFiles(result.data);
      } else setFiles([]);
    } catch (err) {
      setFiles([]);
      setErrorMessage(err?.message || "Không thể tải danh sách file.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await folderService.getAllFolder();
      setFolders(normalizeResponseData(result));
    } catch (err) {
      setFolders([]);
      setErrorMessage(err?.message || "Không thể tải danh sách file.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    loadFolders();
  }, []);

  const handleUploadFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      for (const file of selectedFiles) {
        const uploadResponse = await fileService.uploadFile(file, {
          isGlobal: true,
          folderId: null,
        });
      }
      toast.success("Upload file thành công.");
      await loadFiles();
    } catch (err) {
      console.error(err);
      setErrorMessage(err?.message || "Upload thất bại.");
      toast.error("Upload thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    await handleUploadFiles(selectedFiles);
  };

  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (files.length === 0) return;

    const folderName = files[0].webkitRelativePath.split("/")[0];

    const formData = new FormData();

    formData.append("folderName", folderName);
    // formData.append("documentId", null);
    formData.append("global", true);
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await folderService.uploadFolder(formData);
    if (res) {
      toast.success("upload thành công!");
      loadFolders();
    }
  };

  return (
    <section className=" w-full p-3 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-medium text-slate-900">
              Proof file
            </span>
            <span className="text-sm text-slate-500">
              {files.length} files, {folders.length} folders
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc]"
            disabled={isUploading}
          >
            <Upload size={16} />
            Upload file
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1a73e8] hover:text-[#1a73e8]"
            disabled={isUploading}
          >
            <FolderOpen size={16} />
            Upload folder
          </button>

          {isUploading ? <ClipLoader size={18} color="#1a73e8" /> : null}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        webkitdirectory=""
        directory=""
        onChange={handleFolderSelect}
        className="hidden"
      />

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className=" p-4 w-full">
        <div className="mt-2">
          {isLoading ? (
            <div className="py-10 text-center text-slate-500">
              Đang tải danh sách file...
            </div>
          ) : files.length ? (
            <>
              {files.map((doc) => (
                <FileItem key={doc.id} doc={doc} loadFiles={loadFiles} />
              ))}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
              Chưa có file
            </div>
          )}
          {folders.length ? (
            <>
              {folders.map((f) => (
                <FolderItem key={f.id} folder={f} loadFolders={loadFolders} />
              ))}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default ProofFileSection;
