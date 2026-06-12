import React, { useEffect, useState } from "react";
import {
  FolderOpen,
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import folderService from "../services/folderService";
import { toast } from "react-toastify";
import { formatDate } from "../utils/utilsFunction";

const FolderPublic = () => {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [folder, setFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const base = import.meta.env.VITE_API_URL || "";

  const loadAllFileFolders = async () => {
    setLoading(true);
    try {
      const result = await folderService.getFolder(folderId);

      var data = result.data;
      if (data) {
        setFiles(data["files"]);
        setFolder(data["folder"]);
      }
    } catch (err) {
      toast.error("Đã lỗi xảy ra!");
      navigate(-1);
      setFolder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllFileFolders();
  }, []);

  const getDownloadUrl = (doc) => {
    if (!doc) return "";
    return `${base}/ProofFolder/${doc.id}`;
  };

  const getDownloadFileUrl = (doc) => {
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
    <main className="min-h-screen bg-[#f1f3f4] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex flex-row justify-between w-full max-w-[1440px] items-center gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a73e8] text-white">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-lg font-medium text-slate-900">Docs</h1>
              <p className="text-xs text-slate-500">Realtime Editor</p>
            </div>
          </div>

          {/* <div className="flex">
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="hidden rounded-full bg-[#1a73e8] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#1557b0] md:block"
            >
              login
            </button>
          </div> */}
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6">
        <section className="relative rounded-3xl bg-white p-5 md:p-6">
          {/* Header */}
          <div
            onClick={() => navigate(-1)}
            className=" absolute top-0 left-0 p-3 hover:scale-110 hover:text-blue-500"
          >
            <ArrowLeft />
          </div>
          {folder && (
            <div className="mb-8 mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className=" ">
                <div className="flex flex-row gap-2 items-center justify-center">
                  <FolderOpen className="text-[#1a73e8]" size={20} />
                  <h3 className="text-xl font-medium">{folder.name}</h3>
                </div>

                <p className="text-sm text-slate-500">
                  •Create at {formatDate(folder.createdAt)}
                </p>
              </div>

              <button
                onClick={() => window.open(getDownloadUrl(folder), "_blank")}
                className="flex items-center gap-2 rounded-lg border px-2 py-2 hover:bg-blue-400"
              >
                <Download size={16} />
                Tải toàn bộ
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden h-screen rounded-xl border border-slate-200">
            <div className="hidden grid-cols-12 bg-slate-50 px-6 py-3 text-sm font-medium text-slate-600 md:grid">
              <div className="col-span-7">Tên</div>
              <div className="col-span-3">Ngày tạo</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-1"></div>
            </div>

            {files &&
              files.map((file) => (
                <div
                  key={file.id}
                  className="group border-b border-slate-100 px-4 py-4 hover:bg-[#f8fafc] md:px-6"
                >
                  <div className="grid items-center gap-3 md:grid-cols-12">
                    <div className="md:col-span-7">
                      <button className="flex items-center gap-3 text-left hover:text-[#1a73e8]">
                        <FileText
                          size={20}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8]"
                        />
                        <span className="font-medium break-all">
                          {file.fileName}
                        </span>
                      </button>
                    </div>

                    <div className="text-sm text-slate-500 md:col-span-3">
                      {formatDate(file.createdAt)}
                    </div>

                    <div className="text-sm text-slate-500 md:col-span-1">
                      {file.fileSize}
                    </div>

                    <div className="md:col-span-1 md:text-right">
                      <button
                        onClick={() =>
                          window.open(getDownloadFileUrl(file), "_blank")
                        }
                        className="opacity-100  transition hover:text-blue-500"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default FolderPublic;
