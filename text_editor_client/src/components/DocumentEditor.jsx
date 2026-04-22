import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";
import {
  Clock3,
  FileText,
  Home,
  Lock,
  Save,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";
import { sessionService } from "../services/sessionService";

const SERVICE_URL =
  "https://ej2services.syncfusion.com/production/web-services/api/documenteditor/";

const ROLE_WEIGHT = {
  Viewer: 1,
  Editor: 2,
  Owner: 3,
};

const SECTION_PERMISSION_OPTIONS = [
  { value: "viewer", label: "View only" },
  { value: "editor", label: "Owner + Editor can edit" },
  { value: "owner", label: "Owner only" },
];

const permissionLabel = {
  viewer: "View only",
  editor: "Editable by Owner + Editor",
  owner: "Editable by Owner",
};

const resolveRequiredRole = (permission) => {
  if (permission === "owner") {
    return "Owner";
  }
  if (permission === "editor") {
    return "Editor";
  }
  return null;
};

const defaultMembers = [
  { id: "u1", name: "Minh", role: "Owner" },
  { id: "u2", name: "Lan", role: "Editor" },
  { id: "u3", name: "Huy", role: "Viewer" },
];

const buildSections = (documentTitle) => [
  {
    id: "intro",
    name: "01",
    title: "Tong quan tai lieu",
    permission: "editor",
    content: `${documentTitle}\n\nDay la khung noi dung mock de ban test giao dien Word editor.\n\n- Heading ro rang\n- Khu vuc viet noi dung lon\n- De mo rong upload, autosave va realtime`,
  },
  {
    id: "scope",
    name: "02",
    title: "Pham vi va yeu cau",
    permission: "owner",
    content:
      "Pham vi va yeu cau\n\nSection nay phu hop de dat requirement, acceptance criteria va ghi chu cho PM, dev, QA.",
  },
  {
    id: "delivery",
    name: "03",
    title: "Ke hoach trien khai",
    permission: "viewer",
    content:
      "Ke hoach trien khai\n\n1. Chuan bi file\n2. Chinh sua noi dung\n3. Luu version\n4. Dong bo backend sau",
  },
];

const DocumentEditor = ({ documentId }) => {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const currentUser = sessionService.getCurrentUser();
  const [documentTitle, setDocumentTitle] = useState("Untitled document");
  const [sections, setSections] = useState(() =>
    buildSections("Untitled document"),
  );
  const [activeSectionId, setActiveSectionId] = useState("intro");
  const [lastSavedAt, setLastSavedAt] = useState("Not saved");
  const [status, setStatus] = useState("All changes saved");

  const members = useMemo(() => {
    if (!currentUser?.name) {
      return defaultMembers;
    }

    const exists = defaultMembers.some(
      (member) => member.name.toLowerCase() === currentUser.name.toLowerCase(),
    );

    if (exists) {
      return defaultMembers;
    }

    return [
      { id: currentUser.id || "me", name: currentUser.name, role: "Editor" },
      ...defaultMembers,
    ];
  }, [currentUser]);

  const currentUserRole = useMemo(() => {
    if (!currentUser?.name) {
      return "Owner";
    }

    const member = members.find(
      (item) => item.name.toLowerCase() === currentUser.name.toLowerCase(),
    );
    return member?.role || "Viewer";
  }, [currentUser, members]);

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId, sections],
  );

  const canEditSection = (section, role) => {
    if (!section) {
      return false;
    }

    const requiredRole = resolveRequiredRole(section.permission);
    if (!requiredRole) {
      return false;
    }

    return ROLE_WEIGHT[role] >= ROLE_WEIGHT[requiredRole];
  };

  const applySectionPermission = (section) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !section) {
      return;
    }

    editor.isReadOnly = !canEditSection(section, currentUserRole);
  };

  const openSectionContent = (section) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !section) {
      return;
    }

    if (section.serializedContent) {
      editor.open(section.serializedContent);
      applySectionPermission(section);
      return;
    }

    editor.openBlank();
    if (editor.editor && section.content) {
      editor.editor.insertText(section.content);
    }
    applySectionPermission(section);
  };

  useEffect(() => {
    setDocumentTitle(`Document ${documentId}`);
    setSections(buildSections(`Document ${documentId}`));
    setActiveSectionId("intro");
    setStatus("All changes saved");
  }, [documentId]);

  useEffect(() => {
    if (!activeSection) {
      return;
    }

    openSectionContent(activeSection);
    setStatus(
      canEditSection(activeSection, currentUserRole)
        ? "Editing"
        : "Read-only by section permission",
    );
  }, [activeSection, currentUserRole]);

  const handleCreated = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor) {
      return;
    }

    editor.serviceUrl = SERVICE_URL;
    openSectionContent(activeSection);
  };

  const persistCurrentSection = () => {
    if (!activeSection || !canEditSection(activeSection, currentUserRole)) {
      return;
    }

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
    if (!canEditSection(activeSection, currentUserRole)) {
      setStatus("You do not have permission to save this section");
      return;
    }

    persistCurrentSection();
    setLastSavedAt(
      new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    setStatus("All changes saved");
  };

  const handleSectionClick = (sectionId) => {
    persistCurrentSection();
    setActiveSectionId(sectionId);
  };

  const handlePermissionChange = (sectionId, permission) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, permission } : section,
      ),
    );

    if (sectionId === activeSectionId) {
      const nextSection =
        sections.find((section) => section.id === sectionId) || activeSection;
      const updatedSection = { ...nextSection, permission };

      const hasAccess = canEditSection(updatedSection, currentUserRole);
      applySectionPermission(updatedSection);
      setStatus(hasAccess ? "Editing" : "Read-only by section permission");
    }
  };

  const canEditActiveSection = canEditSection(activeSection, currentUserRole);

  return (
    <main className="h-screen overflow-hidden bg-[#f1f3f4] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            onClick={() => navigate(APP_ROUTES.home)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
            aria-label="Back to home"
          >
            <Home size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a73e8] text-white">
              <FileText size={18} />
            </div>
            <input
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              className="w-[240px] rounded-md px-2 py-1.5 text-lg font-medium outline-none hover:bg-slate-100 focus:bg-slate-100 md:w-[360px]"
              placeholder="Untitled document"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-medium text-[#1967d2] xl:inline-flex">
              ID {documentId}
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canEditActiveSection}
            >
              <Save size={16} />
              Save
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#185abc]"
            >
              <Share2 size={15} />
              Share
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)] min-h-0">
        <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Outline
          </p>
          <div className="mt-3 space-y-3">
            {sections.map((section) => {
              const isActive = section.id === activeSection?.id;

              return (
                <div
                  key={section.id}
                  className={`rounded-xl border p-3 ${
                    isActive
                      ? "border-[#1a73e8] bg-[#e8f0fe]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSectionClick(section.id)}
                    className="w-full text-left"
                  >
                    <p className="text-xs text-slate-500">
                      Section {section.name}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {section.title}
                    </p>
                  </button>

                  <label className="mt-3 block">
                    <span className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500">
                      <ShieldCheck size={12} /> Permission
                    </span>
                    <select
                      value={section.permission}
                      onChange={(event) =>
                        handlePermissionChange(section.id, event.target.value)
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#1a73e8]"
                    >
                      {SECTION_PERMISSION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-200 bg-white px-4 py-3 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
              <span>
                Editing: <strong>{activeSection?.title}</strong>
              </span>
              <span className="inline-flex items-center gap-2">
                {canEditActiveSection ? (
                  <Clock3 size={14} />
                ) : (
                  <Lock size={14} />
                )}
                {status} - {lastSavedAt}
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-[#eef2ff] p-3 md:p-5">
            <div className="h-full rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_40px_100px_-65px_rgba(15,23,42,0.7)] md:p-3">
              <div className="h-full overflow-hidden rounded-xl border border-slate-200">
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
        </section>
      </div>
    </main>
  );
};

export default DocumentEditor;
