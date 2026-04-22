import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock3,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { APP_ROUTES } from "../constants/routes";

import { http } from "../services/http";
import { sessionService } from "../services/sessionService";

const seedDocuments = [
  {
    id: "brief-q2-2026",
    title: "Q2 Product Brief",
    description: "Ke hoach phat trien tinh nang cho quy 2.",
    updatedAt: "2026-04-20T10:00:00.000Z",
    sections: 7,
    owner: "Minh",
    lastEditor: "Lan",
  },
  {
    id: "meeting-notes",
    title: "Weekly Meeting Notes",
    description: "Tong hop ghi chu hop team theo tuan.",
    updatedAt: "2026-04-19T15:30:00.000Z",
    sections: 4,
    owner: "Lan",
    lastEditor: "Minh",
  },
  {
    id: "ux-research",
    title: "UX Research Summary",
    description: "Tong hop phan hoi nguoi dung va de xuat cai tien.",
    updatedAt: "2026-04-18T09:00:00.000Z",
    sections: 9,
    owner: "Huy",
    lastEditor: "Huy",
  },
];

const readDocuments = () => {
  // gọi api
  // const storedDocuments = documentService.getRecentDocuments();
  return seedDocuments;
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const HomePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const currentUser = sessionService.getCurrentUser();
  const [documents, setDocuments] = useState(readDocuments);
  const [isUploading, setIsUploading] = useState(false);
  const [keyword, setKeyword] = useState("");

  const openDocument = (documentId) => {
    navigate(`${APP_ROUTES.editor}/${documentId}`);
  };

  const filteredDocuments = useMemo(() => {
    if (!keyword.trim()) {
      return documents;
    }

    const normalizedKeyword = keyword.toLowerCase();
    return documents.filter((doc) => {
      return (
        doc.title.toLowerCase().includes(normalizedKeyword) ||
        doc.description.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [documents, keyword]);

  const handleUpload = (file) => {
    setIsUploading(true);

    window.setTimeout(() => {
      const documentId = `mock-${Date.now()}`;
      const nextDocument = {
        id: documentId,
        title: file.name.replace(/\.docx$/i, ""),
        description: "Tai lieu moi duoc tao tu file upload.",
        updatedAt: new Date().toISOString(),
        sections: 5,
        owner: currentUser?.name || "Workspace",
        lastEditor: currentUser?.name || "Workspace",
      };

      const nextDocuments = [
        nextDocument,
        ...documents.filter((item) => item.id !== documentId),
      ].slice(0, 8);

      setDocuments(nextDocuments);
      // save;
      // documentService.saveRecentDocument(nextDocument);
      setIsUploading(false);
      openDocument(documentId);
    }, 650);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    handleUpload(file);
    event.target.value = "";
  };

  const handleCreateBlank = () => {
    const documentId = `doc-${Date.now()}`;
    const nextDocument = {
      id: documentId,
      title: "Untitled document",
      description: "Tai lieu moi.",
      updatedAt: new Date().toISOString(),
      sections: 1,
      owner: currentUser?.name || "Workspace",
      lastEditor: currentUser?.name || "Workspace",
    };
    const nextDocuments = [nextDocument, ...documents].slice(0, 20);
    setDocuments(nextDocuments);
    // lại save
    // documentService.saveRecentDocument(nextDocument);
    openDocument(documentId);
  };

  const handleLogout = () => {
    sessionService.clearStore();
    http.setToken(null);
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#f1f3f4] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a73e8] text-white">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-lg font-medium text-slate-900">Docs</h1>
              <p className="text-xs text-slate-500">Realtime Editor</p>
            </div>
          </div>

          <label className="ml-auto flex w-full max-w-xl items-center gap-3 rounded-full bg-[#f1f3f4] px-4 py-2.5">
            <Search size={18} className="text-slate-500" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tim tai lieu"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>

          <div className="hidden rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 md:block">
            {currentUser?.name || "Workspace user"}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-red-500 hover:text-white md:block"
          >
            logout
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6">
        <section className="rounded-3xl bg-white p-5 md:p-6">
          <p className="text-sm font-medium text-slate-500">
            Start a new document
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={handleCreateBlank}
              className="flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white transition hover:border-[#1a73e8] hover:shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#1a73e8]">
                <Plus size={22} />
              </div>
              <p className="text-sm font-medium">Blank document</p>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white transition hover:border-[#1a73e8] hover:shadow-sm"
              disabled={isUploading}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#1a73e8]">
                <Upload size={20} />
              </div>
              <p className="text-sm font-medium">Upload .docx</p>
              <p className="text-xs text-slate-500">
                {isUploading ? "Dang tai len..." : "Mo file Word de chinh sua"}
              </p>
            </button>

            <article className="flex h-40 flex-col justify-between rounded-2xl border border-slate-200 bg-[#fff8e1] p-4">
              <p className="text-sm font-medium text-slate-700">Project plan</p>
              <p className="text-xs text-slate-500">
                Template cho task va milestone
              </p>
            </article>

            <article className="flex h-40 flex-col justify-between rounded-2xl border border-slate-200 bg-[#e8f5e9] p-4">
              <p className="text-sm font-medium text-slate-700">
                Meeting notes
              </p>
              <p className="text-xs text-slate-500">
                Template ghi chu hop nhanh
              </p>
            </article>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={handleFileChange}
          />
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">
              Recent documents
            </h2>
            <span className="text-sm text-slate-500">
              {filteredDocuments.length} tai lieu
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    Name
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    Owner
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    Last modified
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    Sections
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
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
                            {doc.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {doc.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4">
                      {doc.owner || "Workspace"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={14} />
                        {formatDate(doc.updatedAt)}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4">
                      {doc.sections || "-"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-4">
                      <button
                        type="button"
                        onClick={() => openDocument(doc.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:border-[#1a73e8] hover:text-[#1a73e8]"
                      >
                        <FolderOpen size={15} />
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

export default HomePage;
