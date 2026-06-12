import React from "react";
import {
  FolderOpen,
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  Search,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const getIcon = (type) => {
  const iconClass =
    "flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8]";
  switch (type) {
    case "excel":
      return (
        <div className={iconClass}>
          <FileSpreadsheet size={20} />
        </div>
      );
    case "image":
      return (
        <div className={iconClass}>
          <FileImage size={20} />
        </div>
      );
    default:
      return (
        <div className={iconClass}>
          <FileText size={20} />
        </div>
      );
  }
};

const files = [
  {
    id: 1,
    name: "BangDiem.pdf",
    size: "1.2 MB",
    type: "pdf",
  },
  {
    id: 2,
    name: "ChungChiToeic.pdf",
    size: "850 KB",
    type: "pdf",
  },
  {
    id: 3,
    name: "BangTongHop.xlsx",
    size: "450 KB",
    type: "excel",
  },
  {
    id: 4,
    name: "MinhChung.png",
    size: "2.1 MB",
    type: "image",
  },
];

const FolderPublic = ({ folder }) => {
  const navigate = useNavigate();
  const { folderId } = useParams();

  const totalSize = files.reduce(
    (sum, file) => sum + (file.sizeInBytes || 0),
    0,
  );

  console.log(folderId);

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

          <div className="flex">
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="hidden rounded-full bg-[#1a73e8] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#1557b0] md:block"
            >
              login
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6">
        <section className="rounded-3xl bg-white p-5 md:p-6">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="text-[#1a73e8]" size={20} />

              <div>
                <h3 className="text-xl font-medium">tên tài liệu</h3>
                <p className="text-sm text-slate-500">• Chia sẻ công khai</p>
              </div>
            </div>

            <button className="flex items-center gap-2 rounded-lg border px-2 py-2 hover:bg-blue-400">
              <Download size={16} />
              Tải toàn bộ
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="hidden grid-cols-12 bg-slate-50 px-6 py-3 text-sm font-medium text-slate-600 md:grid">
              <div className="col-span-7">Tên</div>
              <div className="col-span-3">Ngày tạo</div>
              <div className="col-span-1">Size</div>
              <div className="col-span-1"></div>
            </div>

            {files.map((file) => (
              <div
                key={file.id}
                className="group border-b border-slate-100 px-4 py-4 hover:bg-[#f8fafc] md:px-6"
              >
                <div className="grid items-center gap-3 md:grid-cols-12">
                  <div className="md:col-span-7">
                    <button className="flex items-center gap-3 text-left hover:text-[#1a73e8]">
                      {getIcon(file.type)}
                      <span className="font-medium break-all">{file.name}</span>
                    </button>
                  </div>

                  <div className="text-sm text-slate-500 md:col-span-3">
                    {file.createdAt}
                  </div>

                  <div className="text-sm text-slate-500 md:col-span-1">
                    {file.size}
                  </div>

                  <div className="md:col-span-1 md:text-right">
                    <button className="opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
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
