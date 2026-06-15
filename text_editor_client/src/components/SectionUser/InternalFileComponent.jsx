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
  MoreHorizontal,
  MoveDiagonal2,
  Plus,
  Upload,
  UserCheck,
} from "lucide-react";

import fileService from "../../services/fileService";
import folderService from "../../services/folderService";
import { CgAdd, CgSpinner } from "react-icons/cg";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import { SiAuthelia } from "react-icons/si";
import FileItemUser from "./FileItemUser";
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

const InternalFileComponent = ({ documentId }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);

  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

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
    loadFolders();
  }, []);

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    await handleUploadFiles(selectedFiles);
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

  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (files.length === 0) return;

    const folderName = files[0].webkitRelativePath.split("/")[0];

    const formData = new FormData();

    formData.append("folderName", folderName);
    formData.append("documentId", documentId);
    formData.append("global", false);
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await folderService.uploadFolder(formData);
    if (res) {
      toast.success("upload thành công!");
      loadFolders();
    }
  };

  const loadFolders = async () => {
    setIsLoadingFolder(true);
    try {
      const result = await folderService.getAllInternalFolder(documentId);
      setFolders(result.data);
    } catch (err) {
      setFolders([]);
    } finally {
      setIsLoadingFolder(false);
    }
  };

  return (
    <>
      <div className="flex flex-row items-center justify-between mt-5">
        <div className="flex relative items-center flex-row gap-2.5">
          <div className="flex items-center   text-lg font-medium text-slate-900">
            File nọi bộ
            <span className="text-sm text-gray-500 ml-2">
              {files && files.length} files
            </span>
          </div>
          <div className="   right-0 ">
            <div className="relative inline-block group ">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full  px-2 py-1 text-sm font-medium text-gray-500 transition bg-amber-50 hover:bg-gray-200"
                disabled={isUploading}
              >
                <MoreHorizontal size={16} />
              </button>

              {/* Dropdown */}
              <div className="invisible absolute left-0 top-full z-10 mt-2 min-w-[180px] rounded-lg border border-slate-200 bg-white shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Upload size={16} />
                  Upload file
                </button>

                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <FolderOpen size={16} />
                  Upload folder
                </button>
              </div>
            </div>
          </div>

          {isUploading && <ClipLoader size={18} color="#1a73e8" />}

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
            onChange={handleFolderSelect}
            className="hidden"
          />
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
            <FileItemUser
              key={doc.id}
              doc={doc}
              isEdit={true}
              loadFiles={loadFiles}
            />
          ))
        ) : null}

        {/* folders */}

        {!isLoadingFolder && (
          <>
            {folders && folders.length
              ? folders.map((folder) => (
                  <FolderItemUser
                    key={folder.id}
                    folder={folder}
                    isEdit={true}
                    loadFolders={loadFolders}
                  />
                ))
              : null}
          </>
        )}
      </div>
    </>
  );
};

export default InternalFileComponent;
