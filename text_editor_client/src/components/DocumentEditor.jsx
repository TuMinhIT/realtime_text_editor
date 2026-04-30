import React, { useEffect, useRef, useState } from "react";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";
import { FileText, Home, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";
import { documentService } from "../services/documentService";

const SERVICE_URL =
  "https://ej2services.syncfusion.com/production/web-services/api/documenteditor/";

const extractTitleFromSfdt = (sfdt, fallbackTitle) => {
  try {
    const parsed = JSON.parse(sfdt);
    const firstBlock =
      parsed?.sections?.[0]?.blocks?.find((block) => Array.isArray(block?.inlines)) ||
      parsed?.sections?.[0]?.blocks?.[0];

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
  const [status, setStatus] = useState("Dang tai tai lieu...");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sfdtContent, setSfdtContent] = useState("");

  const openDocumentContent = (sfdt) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !sfdt) {
      return;
    }

    editor.open(sfdt);
  };

  useEffect(() => {
    let isMounted = true;

    const loadDocument = async () => {
      if (!documentId) {
        setErrorMessage("Khong tim thay documentId tren route.");
        setStatus("Khong mo duoc tai lieu");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setStatus("Dang tai tai lieu...");

      try {
        const sfdt = await documentService.getDocumentContent(documentId);
        if (!isMounted) {
          return;
        }

        setSfdtContent(sfdt);
        setDocumentTitle(extractTitleFromSfdt(sfdt, `Document ${documentId}`));
        setStatus("Da tai xong, san sang chinh sua");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error?.message || "Khong tai duoc noi dung tai lieu tu backend.",
        );
        setStatus("Khong mo duoc tai lieu");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
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
    setStatus(
      "Da serialize SFDT o client. De luu that, ban nen them endpoint PUT /api/Document/{id}/content.",
    );
  };

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
              className="w-[240px] rounded-md px-2 py-1.5 text-lg font-medium outline-none hover:bg-slate-100 focus:bg-slate-100 md:w-[360px]"
              placeholder="Untitled document"
            />
          </div>

          <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
            <span className="hidden rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-medium text-[#1967d2] xl:inline-flex">
              ID {documentId}
            </span>
            <span className="hidden md:inline">{status}</span>
            <span className="hidden lg:inline">Luu luc {lastSavedAt}</span>
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

        <div className="mx-auto h-full max-w-[1400px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_40px_100px_-65px_rgba(15,23,42,0.7)]">
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
      </section>
    </main>
  );
};

export default DocumentEditor;
