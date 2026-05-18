import React, { useEffect, useRef, useState } from "react";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";
import {
  Home,
  PanelLeft,
  Save,
  Lock,
  Menu,
  X,
  Plus,
  Users,
  BlocksIcon,
  Download,
} from "lucide-react";

import { TbLockOpen } from "react-icons/tb";

import { useNavigate, useParams } from "react-router-dom";
import { documentService } from "../services/documentService";
import { toast } from "react-toastify";
import { BiLockAlt } from "react-icons/bi";
import { CgUnblock } from "react-icons/cg";

const SERVICE_URL = import.meta.env.VITE_API_URL + "/document";

const normalizeJson = (value) => {
  if (!value) {
    return "";
  }

  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    return value;
  }
};

const DocumentEditor = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const hasInitializedVersionZero = useRef(false);
  const [documentTitle, setDocumentTitle] = useState("Untitled document");
  const [lastSavedAt, setLastSavedAt] = useState("Chua luu");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sfdtContent, setSfdtContent] = useState("");
  const [showNavigationPane, setShowNavigationPane] = useState(true);
  const [document, setDocument] = useState({});
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const openDocumentContent = (sfdt) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !sfdt) {
      return;
    }
    editor.isReadOnly = document.isActive;
    editor.open(sfdt);
  };

  const loadDocument = async () => {
    if (!documentId) {
      setErrorMessage("Khong tim thay documentId tren route.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await documentService.getDocumentContent(documentId);
      if (result == null) {
        navigate("/admin");
      }
      if (result != null) {
        const jsonContent = result.jsonContent;

        setDocument(result);
        setSfdtContent(jsonContent);
        setDocumentTitle(result.title);

        setIsDirty(false);
        setHasAutoSaved(false);
      } else {
        toast.error(result.message || "Khong tai duoc noi dung tai lieu.");
      }
    } catch (error) {
      toast.error(
        error?.message || "Khong tai duoc noi dung tai lieu tu backend.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  useEffect(() => {
    if (!isLoading && sfdtContent) {
      openDocumentContent(sfdtContent);
    }
  }, [isLoading, sfdtContent, hasAutoSaved, document.isActive]);

  useEffect(() => {
    const initializeDocumentContent = async () => {
      if (
        isLoading ||
        !sfdtContent ||
        hasInitializedVersionZero.current ||
        document?.version !== 0
      ) {
        return;
      }

      const editor = editorRef.current?.documentEditor;
      if (!editor) {
        return;
      }

      hasInitializedVersionZero.current = true;

      try {
        const serialized = normalizeJson(editor.serialize());
        await documentService.updateDocumentContent(documentId, serialized);
        setSfdtContent(serialized);
      } catch (error) {
        hasInitializedVersionZero.current = false;
        toast.error(error?.message || "Khong the cap nhat noi dung ban dau.");
      }
    };

    initializeDocumentContent();
  }, [isLoading, sfdtContent, document?.version, documentId]);

  const handleContentChange = () => {
    if (isLoading || isSaving) {
      return;
    }

    const editor = editorRef.current?.documentEditor;
    if (!editor) {
      return;
    }

    const currentSerialized = normalizeJson(editor.serialize());
    const hasChanged =
      currentSerialized !== normalizeJson(sfdtContent) ||
      documentTitle.trim() !== (document?.title || "").trim();

    setIsDirty(hasChanged);
  };

  const updateDirtyStateForTitle = (nextTitle) => {
    const editor = editorRef.current?.documentEditor;
    const currentSerialized = editor
      ? normalizeJson(editor.serialize())
      : normalizeJson(sfdtContent);

    const hasChanged =
      currentSerialized !== normalizeJson(sfdtContent) ||
      nextTitle.trim() !== (document?.title || "").trim();

    setIsDirty(hasChanged);
  };

  const handleSave = async () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const serialized = normalizeJson(editor.serialize());

      await Promise.all([
        documentService.updateDocumentTitle(documentId, documentTitle.trim()),
        documentService.updateDocumentContent(documentId, serialized),
      ]);

      setSfdtContent(serialized);
      setDocument((prev) => ({
        ...prev,
        title: documentTitle.trim(),
        version:
          typeof prev?.version === "number" ? prev.version + 1 : prev?.version,
      }));
      setLastSavedAt(
        new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );

      setIsDirty(false);
    } catch (error) {
      setErrorMessage(
        error?.message || "Khong the luu tai lieu. Hay kiem tra API backend.",
      );
      toast.error("Luu that bai.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeStatus = async () => {
    setIsSaving(true);
    setErrorMessage("");

    try {
      // Gọi API để toggle isActive
      await documentService.updateStatus(documentId, !document.isActive);
      setDocument((prev) => ({
        ...prev,
        isActive: !prev.isActive,
      }));

      toast.success("Cập nhật trạng thái thành công");
    } catch (error) {
      toast.error("Cập nhật thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNavigationPane = () => {
    const nextValue = !showNavigationPane;
    setShowNavigationPane(nextValue);

    const editor = editorRef.current?.documentEditor;
    if (editor?.documentEditorSettings) {
      editor.documentEditorSettings.showNavigationPane = nextValue;
      editor.focusIn();
    }
  };

  const handleDownloadDocx = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor) {
      toast.error("Không thể xuất tài liệu.");
      return;
    }

    try {
      // Export as DOCX format
      const fileName = documentTitle.trim() || "Untitled";
      editor.save(fileName, "Docx");
      toast.success("Tải xuống thành công!");
    } catch (error) {
      toast.error("Lỗi khi tải xuống tài liệu.");
      console.error("Download error:", error);
    }
  };

  useEffect(() => {
    const editor = editorRef.current?.documentEditor;
    if (editor?.documentEditorSettings) {
      editor.documentEditorSettings.showNavigationPane = showNavigationPane;
    }
  }, [showNavigationPane]);

  return (
    <main className="overflow-hidden bg-[#f1f3f4] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
            aria-label="Back to home"
          >
            <Home size={18} />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleNavigationPane}
              className="inline-flex items-center gap-2 rounded-full  bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              {showNavigationPane ? <X size={18} /> : <Menu size={18}></Menu>}
            </button>

            <input
              value={documentTitle}
              onChange={(event) => {
                const nextTitle = event.target.value;
                setDocumentTitle(nextTitle);
                updateDirtyStateForTitle(nextTitle);
              }}
              className="w-60 text-indigo-700 px-2 py-1.5 text-lg font-medium outline-none hover:bg-slate-100 focus:bg-slate-100 md:w-[360px]"
              placeholder="Untitled document"
            />
          </div>

          <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
            {!isDirty ? (
              <div className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                ✓
                <span className=" hidden text-xs text-slate-500 md:inline-flex">
                  Lưu lúc {lastSavedAt}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white">
                <span className=" hidden text-xs  md:inline-flex">
                  Chưa lưu
                </span>
              </div>
            )}

            {/*  block và unBlock cho phép chỉnh sửa hoặc không */}
            {document != null && (
              <button
                type="button"
                onClick={handleChangeStatus}
                // disabled={isSaving}
              >
                {/* ==true là user dc sửa ngược lại thì admin chỉnh sửa */}
                {document.isActive ? (
                  <>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-red-400 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60">
                      User chỉnh sửa
                      <TbLockOpen size={16} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60">
                      Admin chỉnh sửa
                      <BiLockAlt size={16} />
                    </div>
                  </>
                )}
              </button>
            )}

            {document && !document.isActive && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <span>Luu...</span> : null}
                <Save size={16} />
                {!isSaving ? <span>Save</span> : null}
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadDocx}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
          </div>
        </div>
      </header>

      <section className="h-[calc(100vh-64px)] min-h-0 bg-[#eef2ff] p-2 md:p-3">
        <div className="mx-auto h-full  overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_40px_100px_-65px_rgba(15,23,42,0.7)]">
          <DocumentEditorContainerComponent
            ref={editorRef}
            height="100%"
            enableToolbar
            contentChange={handleContentChange}
            documentEditorSettings={{
              showNavigationPane,
            }}
            serviceUrl={SERVICE_URL}
          >
            <Inject services={[Toolbar]} />
          </DocumentEditorContainerComponent>
        </div>
      </section>
    </main>
  );
};

export default DocumentEditor;
