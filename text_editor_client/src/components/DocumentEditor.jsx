import React, { useEffect, useRef, useState } from "react";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";
import { FileText, Home, PanelLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";
import { documentService } from "../services/documentService";
import { toast } from "react-toastify";

const SERVICE_URL =
  "https://ej2services.syncfusion.com/production/web-services/api/documenteditor/";

const extractTitleFromSfdt = (sfdt, fallbackTitle) => {
  try {
    const parsed = JSON.parse(sfdt);
    const firstBlock =
      parsed?.sections?.[0]?.blocks?.find((block) =>
        Array.isArray(block?.inlines),
      ) || parsed?.sections?.[0]?.blocks?.[0];

    const titleText =
      firstBlock?.inlines
        ?.map((inline) => inline.text || "")
        .join("")
        .trim() || "";

    return titleText || fallbackTitle;
  } catch {
    return fallbackTitle;
  }
};

const DocumentEditor = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [documentTitle, setDocumentTitle] = useState("Untitled document");
  const [lastSavedAt, setLastSavedAt] = useState("Chua luu");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sfdtContent, setSfdtContent] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Normal");
  const [showNavigationPane, setShowNavigationPane] = useState(true);

  const openDocumentContent = (sfdt) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !sfdt) {
      return;
    }

    editor.open(sfdt);
  };

  const loadDocument = async () => {
    if (!documentId) {
      setErrorMessage("Khong tim thay documentId tren route.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await documentService.getDocumentContent(documentId);
      if (result.success) {
        const loadedDocument = result.data;

        setSfdtContent(loadedDocument.jsonContent);
        setDocumentTitle(loadedDocument.title);
      } else {
        setErrorMessage(result.message || "Khong tai duoc noi dung tai lieu.");
      }
    } catch (error) {
      setErrorMessage(
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
  }, [isLoading, sfdtContent]);

  const handleCreated = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor) {
      return;
    }

    editor.serviceUrl = SERVICE_URL;

    if (sfdtContent) {
      openDocumentContent(sfdtContent);
    }
  };

  const handleSave = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor) {
      return;
    }

    const serialized = editor.serialize();
    setSfdtContent(serialized);
    setLastSavedAt(
      new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    toast.info(
      "Da serialize SFDT o client. De luu that, ban nen them endpoint PUT /api/Document/{id}/content.",
    );
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

  const handleApplyHeading = (event) => {
    const styleName = event.target.value;
    setSelectedStyle(styleName);

    const editor = editorRef.current?.documentEditor;
    const selectionEditor = editor?.editor;
    if (!selectionEditor) {
      return;
    }

    selectionEditor.applyStyle(styleName);
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
              className="w-60  px-2 py-1.5 text-lg font-medium outline-none hover:bg-slate-100 focus:bg-slate-100 md:w-[360px]"
              placeholder="Untitled document"
            />

            <select
              value={selectedStyle}
              onChange={handleApplyHeading}
              className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              aria-label="Chon style heading"
            >
              <option value="Normal">Normal</option>
              <option value="Heading 1">Heading 1</option>
              <option value="Heading 2">Heading 2</option>
              <option value="Heading 3">Heading 3</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
            {/* <span className="hidden rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-medium text-[#1967d2] xl:inline-flex">
              ID {documentId}
            </span> */}

            <span className="hidden text-xs text-slate-500 md:inline-flex">
              Luu luc {lastSavedAt}
            </span>

            <button
              type="button"
              onClick={handleToggleNavigationPane}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              <PanelLeft size={16} />
              {showNavigationPane ? "An heading" : "Hien heading"}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </header>

      <section className="h-[calc(100vh-64px)] min-h-0 bg-[#eef2ff] p-2 md:p-3">
        {errorMessage ? (
          <div className="mx-auto mb-3 max-w-[1400px] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mx-auto h-full  overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_40px_100px_-65px_rgba(15,23,42,0.7)]">
          <DocumentEditorContainerComponent
            ref={editorRef}
            height="100%"
            enableToolbar
            documentEditorSettings={{
              showNavigationPane,
            }}
            serviceUrl={SERVICE_URL}
            created={handleCreated}
          >
            <Inject services={[Toolbar]} />
          </DocumentEditorContainerComponent>
        </div>
      </section>
    </main>
  );
};

export default DocumentEditor;
