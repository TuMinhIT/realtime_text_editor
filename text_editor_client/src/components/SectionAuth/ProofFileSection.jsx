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
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import FileItem from "./FileItem";

const ROOT_FOLDER_ID = "__root__";
const STORAGE_KEY = "proof-file-section-folder-state-v1";

const getFolderStateFallback = () => ({ folders: [], fileLocations: {} });

const loadFolderState = () => {
  if (typeof window === "undefined") {
    return getFolderStateFallback();
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      return getFolderStateFallback();
    }

    const parsedValue = JSON.parse(storedValue);

    return {
      folders: Array.isArray(parsedValue?.folders) ? parsedValue.folders : [],
      fileLocations:
        parsedValue?.fileLocations &&
        typeof parsedValue.fileLocations === "object"
          ? parsedValue.fileLocations
          : {},
    };
  } catch {
    return getFolderStateFallback();
  }
};

const normalizeResponseData = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const buildFolderPath = (folderId, foldersById) => {
  if (!folderId || folderId === ROOT_FOLDER_ID) {
    return "";
  }

  const segments = [];
  let currentFolder = foldersById.get(folderId);

  while (currentFolder) {
    segments.unshift(currentFolder.name);
    currentFolder = foldersById.get(currentFolder.parentId);
  }

  return segments.join("/");
};

const upsertFolderNode = (state, parentId, folderName) => {
  const normalizedName = folderName
    .trim()
    .replace(/[\\/]+/g, "-")
    .trim();

  if (!normalizedName) {
    return { state, folderId: parentId };
  }

  const existingFolder = state.folders.find(
    (folder) =>
      folder.parentId === parentId &&
      folder.name.toLowerCase() === normalizedName.toLowerCase(),
  );

  if (existingFolder) {
    return { state, folderId: existingFolder.id };
  }

  const newFolder = {
    id: createId(),
    name: normalizedName,
    parentId,
    createdAt: new Date().toISOString(),
  };

  return {
    state: {
      folders: [...state.folders, newFolder],
      fileLocations: { ...state.fileLocations },
    },
    folderId: newFolder.id,
  };
};

const ensureFolderChain = (state, parentFolderId, folderSegments) => {
  let nextState = {
    folders: [...state.folders],
    fileLocations: { ...state.fileLocations },
  };
  let currentParentId = parentFolderId;
  const createdSegments = [];

  for (const segment of folderSegments) {
    const result = upsertFolderNode(nextState, currentParentId, segment);
    nextState = result.state;
    currentParentId = result.folderId;
    createdSegments.push(segment);
  }

  return {
    state: nextState,
    folderId: currentParentId,
    folderPath: createdSegments.join("/"),
  };
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
  const [folderState, setFolderState] = useState(loadFolderState);
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
      setFiles(normalizeResponseData(result));
    } catch (err) {
      setFiles([]);
      setErrorMessage(err?.message || "Không thể tải danh sách file.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") {
        return;
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(folderState));
    } catch {
      // bỏ qua khi localStorage không khả dụng
    }
  }, [folderState]);

  const foldersById = useMemo(() => {
    return new Map(folderState.folders.map((folder) => [folder.id, folder]));
  }, [folderState.folders]);

  const foldersByParentId = useMemo(() => {
    const groupedFolders = new Map();

    for (const folder of folderState.folders) {
      const parentKey = folder.parentId || ROOT_FOLDER_ID;

      if (!groupedFolders.has(parentKey)) {
        groupedFolders.set(parentKey, []);
      }

      groupedFolders.get(parentKey).push(folder);
    }

    for (const folderList of groupedFolders.values()) {
      folderList.sort((left, right) => left.name.localeCompare(right.name));
    }

    return groupedFolders;
  }, [folderState.folders]);

  const folderCounts = useMemo(() => {
    const counts = new Map();

    for (const doc of files) {
      const location = folderState.fileLocations?.[doc.id];
      const folderId = location?.folderId || ROOT_FOLDER_ID;
      counts.set(folderId, (counts.get(folderId) || 0) + 1);
    }

    return counts;
  }, [files, folderState.fileLocations]);

  const enrichedFiles = useMemo(() => {
    return files.map((doc) => {
      const location = folderState.fileLocations?.[doc.id] || {};

      return {
        ...doc,
        folderId: location.folderId || ROOT_FOLDER_ID,
        folderPath: location.folderPath || "",
        relativePath: location.relativePath || doc.fileName || "",
      };
    });
  }, [files, folderState.fileLocations]);

  const selectedFolderPath = useMemo(() => {
    return buildFolderPath(selectedFolderId, foldersById);
  }, [foldersById, selectedFolderId]);

  const visibleFiles = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return enrichedFiles.filter((doc) => {
      if (doc.folderId !== selectedFolderId) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return [doc.fileName, doc.folderPath, doc.relativePath]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedKeyword));
    });
  }, [enrichedFiles, keyword, selectedFolderId]);

  const handleUploadFiles = async (
    selectedFiles,
    { fromFolder = false } = {},
  ) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    let workingFolderState = {
      folders: [...folderState.folders],
      fileLocations: { ...folderState.fileLocations },
    };

    try {
      for (const file of selectedFiles) {
        const { relativePath, fileName, folderSegments } =
          splitRelativePath(file);
        const result = ensureFolderChain(
          workingFolderState,
          selectedFolderId,
          fromFolder ? folderSegments : [],
        );

        workingFolderState = result.state;

        const uploadResponse = await fileService.uploadFile(file, {
          isGlobal: true,
          folderId: result.folderId,
          folderPath: result.folderPath,
          relativePath,
          folderName: result.folderPath.split("/").filter(Boolean).pop() || "",
        });

        const uploadedFileId = uploadResponse?.id || uploadResponse?.fileId;

        if (uploadedFileId) {
          workingFolderState = {
            folders: workingFolderState.folders,
            fileLocations: {
              ...workingFolderState.fileLocations,
              [uploadedFileId]: {
                folderId: result.folderId,
                folderPath: result.folderPath,
                relativePath: fromFolder ? relativePath : fileName,
              },
            },
          };
        }
      }

      setFolderState(workingFolderState);
      toast.success(
        fromFolder ? "Upload folder thành công." : "Upload file thành công.",
      );
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
    await handleUploadFiles(selectedFiles, { fromFolder: false });
  };

  const handleFolderChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    await handleUploadFiles(selectedFiles, { fromFolder: true });
  };

  const createFolder = () => {
    const trimmedFolderName = folderName.trim();

    if (!trimmedFolderName) {
      toast.error("Nhập tên folder.");
      return;
    }

    const nextState = upsertFolderNode(
      folderState,
      selectedFolderId,
      trimmedFolderName,
    );

    setFolderState(nextState.state);
    setSelectedFolderId(nextState.folderId);
    setIsCreateFolderOpen(false);
    setFolderName("");
    toast.success("Đã tạo folder.");
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Bạn có chắc muốn xóa file này?");

    if (!isConfirmed) return;

    try {
      await fileService.deleteFile(id);
      setFolderState((currentState) => {
        const nextLocations = { ...currentState.fileLocations };
        delete nextLocations[id];

        return {
          folders: currentState.folders,
          fileLocations: nextLocations,
        };
      });
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
      toast.success("Đã copy link.");
    } catch (err) {
      console.error(err);
      toast.error("Copy thất bại.");
    }
  };

  return (
    <section className="mt-4 rounded-2xl bg-white p-3 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-medium text-slate-900">
              Proof file
            </span>
            <span className="text-sm text-slate-500">
              {enrichedFiles.length} files, {folderState.folders.length} folders
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateFolderOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1a73e8] hover:text-[#1a73e8]"
            disabled={isUploading}
          >
            <FolderPlus size={16} />
            Tạo folder
          </button>

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
        onChange={handleFolderChange}
        className="hidden"
      />

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className=" bg-white p-4 w-full">
        <div className="mt-2">
          {isLoading ? (
            <div className="py-10 text-center text-slate-500">
              Đang tải danh sách file...
            </div>
          ) : visibleFiles.length ? (
            <>
              {visibleFiles.map((doc) => (
                <FileItem
                  key={doc.id}
                  doc={doc}
                  getDownloadUrl={getDownloadUrl}
                  handleCopy={handleCopy}
                  handleDelete={handleDelete}
                />
              ))}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
              Chưa có file nào trong folder này
            </div>
          )}
        </div>
      </div>

      {isCreateFolderOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">
                  Tạo folder mới
                </h4>
                <p className="text-sm text-slate-500">
                  Folder sẽ được tạo bên trong folder đang chọn.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateFolderOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5">
              <label className="block text-sm font-medium text-slate-700">
                Tên folder
              </label>
              <input
                type="text"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                placeholder="Ví dụ: Proof 2026"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#1a73e8]"
              />

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={createFolder}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc]"
                >
                  <FolderPlus size={16} />
                  Tạo folder
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default ProofFileSection;
