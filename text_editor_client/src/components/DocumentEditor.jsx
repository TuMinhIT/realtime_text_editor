import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  FolderUp,
  Save,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DocumentUpload from "./DocumentUpload";

const SERVICE_URL =
  "https://ej2services.syncfusion.com/production/web-services/api/documenteditor/";

const members = [
  { id: "u1", name: "Minh", role: "Owner" },
  { id: "u2", name: "Lan", role: "Editor" },
  { id: "u3", name: "Huy", role: "Viewer" },
];

const buildSections = (documentTitle) => [
  {
    id: "intro",
    name: "01",
    title: "Tong quan tai lieu",
    summary: "Mo ta muc tieu, pham vi va cach to chuc noi dung.",
    content:
      `${documentTitle}\n\nDay la khung noi dung mock de ban test giao dien Word editor.\n\n- Heading ro rang\n- Khu vuc viet noi dung lon\n- De mo rong upload, autosave va realtime`,
  },
  {
    id: "scope",
    name: "02",
    title: "Pham vi va yeu cau",
    summary: "Gom business rule, use case va ghi chu cho team.",
    content:
      "Pham vi va yeu cau\n\nSection nay phu hop de dat requirement, acceptance criteria va ghi chu cho PM, dev, QA.",
  },
  {
    id: "delivery",
    name: "03",
    title: "Ke hoach trien khai",
    summary: "Tom tat timeline, milestone va danh sach can theo doi.",
    content:
      "Ke hoach trien khai\n\n1. Chuan bi file\n2. Chinh sua noi dung\n3. Luu version\n4. Dong bo backend sau",
  },
];

const DocumentEditor = ({ documentId }) => {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [documentTitle, setDocumentTitle] = useState("Realtime Text Editor");
  const [sections, setSections] = useState(() => buildSections("Realtime Text Editor"));
  const [activeSectionId, setActiveSectionId] = useState("intro");
  const [lastSavedAt, setLastSavedAt] = useState("Chua luu");
  const [status, setStatus] = useState(
    "Trang nay dang la word-style editor mock, toi uu de test bo cuc va luong thao tac.",
  );
  const [isUploading, setIsUploading] = useState(false);

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId, sections],
  );

  const openSectionContent = (section) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !section) {
      return;
    }

    if (section.serializedContent) {
      editor.open(section.serializedContent);
      return;
    }

    editor.openBlank();
    if (editor.editor && section.content) {
      editor.editor.insertText(section.content);
    }
  };

  useEffect(() => {
    openSectionContent(activeSection);
  }, [activeSection]);

  const handleCreated = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor) {
      return;
    }

    editor.serviceUrl = SERVICE_URL;
    openSectionContent(activeSection);
  };

  const persistCurrentSection = () => {
    const editor = editorRef.current?.documentEditor;
    const serialized = editor?.serialize?.();

    setSections((current) =>
      current.map((section) =>
        section.id === activeSection.id
          ? {
              ...section,
              serializedContent: serialized || section.serializedContent,
            }
          : section,
      ),
    );
  };

  const handleSave = () => {
    persistCurrentSection();
    setLastSavedAt(
      new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    setStatus("Da mock save section hien tai. Luc noi backend thi co the goi API tai day.");
  };

  const handleSectionClick = (sectionId) => {
    persistCurrentSection();
    setActiveSectionId(sectionId);
  };

  const handleMockUpload = (file) => {
    setIsUploading(true);
    setStatus(`Dang nap ${file.name} vao workspace mock...`);

    window.setTimeout(() => {
      const nextTitle = file.name.replace(/\.docx$/i, "");
      setDocumentTitle(nextTitle);
      setSections(buildSections(nextTitle));
      setActiveSectionId("intro");
      setIsUploading(false);
      setStatus("Da tao lai workspace tu file mock. Ban co the tiep tuc chinh sua trong editor.");
    }, 600);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f7fb_0%,#eef2ff_100%)] px-4 py-5 text-slate-900 md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
        <section className="rounded-[34px] border border-white/70 bg-white/90 p-5 shadow-[0_35px_120px_-55px_rgba(15,23,42,0.45)] backdrop-blur md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate("/documents")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
              >
                <ArrowLeft size={16} />
                Ve workspace
              </button>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-white">
                  <Sparkles size={14} />
                  Word Editor
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 size={14} />
                  Doc {documentId}
                </span>
              </div>

              <div className="space-y-3">
                <input
                  value={documentTitle}
                  onChange={(event) => setDocumentTitle(event.target.value)}
                  className="w-full bg-transparent text-3xl font-semibold tracking-tight text-slate-950 outline-none md:text-5xl"
                  placeholder="Nhap ten tai lieu"
                />
                <p className="max-w-3xl text-sm leading-6 text-slate-600">
                  {status}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Sections
                </p>
                <p className="mt-2 text-2xl font-semibold">{sections.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Team
                </p>
                <p className="mt-2 text-2xl font-semibold">{members.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Saved
                </p>
                <p className="mt-2 text-lg font-semibold">{lastSavedAt}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
          <aside className="space-y-5">
            <DocumentUpload
              onUpload={handleMockUpload}
              isLoading={isUploading}
              title="Thay file Word"
              description="Neu muon test luong upload ngay trong editor, ban co the mock lai document o day."
              compact
            />

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Outline</p>
                  <h2 className="mt-1 text-xl font-semibold">Danh sach section</h2>
                </div>
                <FileText size={20} className="text-slate-400" />
              </div>

              <div className="mt-5 space-y-3">
                {sections.map((section) => {
                  const isActive = section.id === activeSection?.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleSectionClick(section.id)}
                      className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-white"
                      }`}
                    >
                      <p
                        className={`text-xs uppercase tracking-[0.24em] ${
                          isActive ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        Section {section.name}
                      </p>
                      <h3 className="mt-2 text-base font-semibold">{section.title}</h3>
                      <p
                        className={`mt-2 text-sm leading-6 ${
                          isActive ? "text-slate-200" : "text-slate-600"
                        }`}
                      >
                        {section.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Dang chinh sua</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950 md:text-3xl">
                    {activeSection?.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Layout trung tam mo phong mot trang Word, phu hop cho editor
                    chinh va de noi autosave sau nay.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    <Save size={16} />
                    Save mock
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-[#edf2ff] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] md:p-6">
              <div className="mx-auto max-w-5xl">
                <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.55)]">
                  <div className="h-[76vh] overflow-hidden rounded-[20px] border border-slate-200">
                    <DocumentEditorContainerComponent
                      ref={editorRef}
                      height="100%"
                      enableToolbar
                      serviceUrl={SERVICE_URL}
                      created={handleCreated}
                    >
                      <Inject services={[Toolbar]} />
                    </DocumentEditorContainerComponent>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Document info</p>
                  <h2 className="mt-1 text-xl font-semibold">Thong tin nhanh</h2>
                </div>
                <Clock3 size={20} className="text-slate-400" />
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-slate-400">Document id</p>
                  <p className="mt-1 font-medium text-slate-900">{documentId}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-slate-400">Section hien tai</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {activeSection?.name} - {activeSection?.title}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-slate-400">Trang thai</p>
                  <p className="mt-1 font-medium text-emerald-700">Mock collaboration ready</p>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Collaborators</p>
                  <h2 className="mt-1 text-xl font-semibold">Thanh vien</h2>
                </div>
                <Users size={20} className="text-slate-400" />
              </div>

              <div className="mt-5 space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {member.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      online
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <FolderUp size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Huong mo rong</h2>
                  <p className="text-sm text-slate-600">
                    Co the noi API upload, autosave va socket vao bo cuc nay.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default DocumentEditor;
