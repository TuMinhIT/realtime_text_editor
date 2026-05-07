import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Plus, Users } from "lucide-react";
import { toast } from "react-toastify";

import sectionService from "../services/sectionService";
import documentService from "../services/documentService";
import DocViewer from "../components/SectionAuth/DocViewer";
import UserPermission from "../components/SectionAuth/UserPermission";

const SERVICE_URL =
  "https://ej2services.syncfusion.com/production/web-services/api/documenteditor/";

const normalizeJson = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    return value;
  }
};

const mapPermissionToAssignment = (item) => {
  const permission = (item?.permission || "").toLowerCase();

  return {
    id:
      item?.userId || item?.id || `${item?.userEmail || "user"}-${permission}`,
    userId: item?.userId || item?.id,
    userEmail: item?.userEmail || "",
    userName: item?.userName || item?.fullName || item?.userEmail || "",
    permission: item?.permission || "",
    canEdit: permission === "edit" || permission === "owner",
    canDelete: permission === "owner",
  };
};

const SectionAuthority = () => {
  const location = useLocation();
  const { documentId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [sections, setSections] = useState([]);
  const [documentTitle, setDocumentTitle] = useState(
    location.state?.documentTitle || "Tài liệu",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [previewSfdt, setPreviewSfdt] = useState("");
  const [originalPreview, setOriginalPreview] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const openPreview = (sfdt) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !sfdt) {
      return;
    }

    editor.open(sfdt);
  };

  const applyReadOnlyMode = (flag) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor) {
      return;
    }

    try {
      editor.isReadOnly = flag;
    } catch {
      // Ignore if this Syncfusion build does not expose the flag yet.
    }
  };

  const loadDocument = async () => {
    const result = await documentService.getDocumentContent(documentId);

    if (result.success) {
      const loadedDocument = result.data;
      setDocumentTitle(
        loadedDocument?.title || location.state?.documentTitle || "Tài liệu",
      );
      setPreviewSfdt(loadedDocument.jsonContent);
      setOriginalPreview(loadedDocument.jsonContent);
      return;
    }

    setErrorMessage(result.message || "Không tải được nội dung tài liệu.");
  };

  const loadSections = async () => {
    const result = await sectionService.getAllSectionsByDocument(documentId);
    const list = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.sections)
          ? result.sections
          : [];

    setSections(list);
  };

  // load section and document
  useEffect(() => {
    if (!documentId) {
      setErrorMessage("Không tìm thấy documentId trên route.");
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        await Promise.all([loadDocument(), loadSections()]);
      } catch (error) {
        setErrorMessage(
          error?.message || "Không tải được dữ liệu section từ backend.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [documentId]);

  useEffect(() => {
    if (!sections.length) {
      setSelectedSection(null);

      return;
    }
    //  trả tỏng quan khi vừa load
    setSelectedSection((current) => {
      if (!current) {
        return "tongquan";
      }

      return (
        sections.find((section) => section.id === current.id) || sections[0]
      );
    });
  }, [sections]);

  const loadPreview = async () => {
    setIsPreviewLoading(true);
    setErrorMessage("");

    try {
      const sectionContent = normalizeJson(
        selectedSection.content || selectedSection.jsonContent,
      );

      if (!sectionContent) {
        throw new Error("Thiếu dữ liệu section để dựng preview.");
      }
      if (selectedSection.level == 1) return;

      const preview = await sectionService.previewSection(
        selectedSection.id,
        sectionContent,
        documentId,
      );

      if (!preview.sfdtContent) {
        throw new Error("Backend không trả về SFDT preview hợp lệ.");
      }

      setPreviewSfdt(preview.sfdtContent);
    } catch (error) {
      setPreviewSfdt(originalPreview);
      setErrorMessage(
        error?.message || "Không thể dựng preview section từ backend.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSection || !documentId) {
      if (sectionService.level == 1) return;
      setPreviewSfdt(originalPreview);
      return;
    }

    // Nếu là tổng quan, hiển thị tài liệu gốc
    if (selectedSection === "tongquan") {
      setPreviewSfdt(originalPreview);
      return;
    }

    loadPreview();
  }, [selectedSection, documentId, originalPreview]);

  useEffect(() => {
    openPreview(previewSfdt);
    applyReadOnlyMode(true);
  }, [previewSfdt, selectedSection?.id]);

  const handleCreated = () => {
    openPreview(previewSfdt);
    applyReadOnlyMode(true);
  };

  const handleSave = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !selectedSection) {
      return;
    }
  };

  const handleContentChange = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !selectedSection) {
      return;
    }

    const currentSerialized = normalizeJson(editor.serialize());
  };

  const handleSelectSection = (section) => {
    setSelectedSection(section);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f3f4] text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a73e8] text-white">
              <Lock size={18} />
            </div>

            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Phân quyền section
              </h1>
              <p className="text-xs text-slate-500">
                Chỉnh sửa theo từng section
              </p>
            </div>
          </div>

          <div className="ml-auto text-right text-sm md:text-base">
            <span className="text-slate-500">Văn bản:</span>{" "}
            <span className="font-medium text-slate-900">{documentTitle}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex h-[calc(100vh-73px)] w-full max-w-[1600px] gap-4 overflow-hidden p-4">
        <aside className="flex w-full max-w-[360px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#1a73e8]" />
              <h2 className="text-base font-semibold">Sections</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Chọn section để xem và chỉnh nội dung tương ứng.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {sections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Chưa có section nào.
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setSelectedSection("tongquan")}
              className={`w-full rounded-2xl  border px-2 py-1 text-left transition ${
                selectedSection == "tongquan"
                  ? "border-blue-200 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-gray-300 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-md  font-bold text-slate-900">
                    Tổng quan
                  </div>
                </div>
              </div>
            </button>
            {sections.map((section) => {
              const indentPx = Math.max(0, (section.level || 1) - 1) * 12;
              const isSelected = selectedSection?.id === section.id;
              if (section.level == 1)
                return (
                  <div
                    key={section.id}
                    type="button"
                    className={`w-full  border-b px-2 py-1 text-left transition ${"border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-md  font-bold text-slate-900">
                          {section.title}
                        </div>
                      </div>

                      <div className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        Lv{section.level || 1}
                      </div>
                    </div>
                  </div>
                );
              else
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleSelectSection(section)}
                    style={{ marginLeft: indentPx }}
                    className={`w-full border-b  px-2 py-2 text-left transition ${
                      isSelected
                        ? "border-blue-200 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {section.title}
                        </div>
                      </div>

                      <div className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        Lv{section.level || 1}
                      </div>
                    </div>
                  </button>
                );
            })}
          </div>
        </aside>

        {/* header Nọi dung */}
        <section className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {selectedSection == "tongquan" ? null : (
            <div className="rounded-3xl  border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-row gap-4 items-center lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selectedSection?.title || "Chưa chọn section"}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {/* truyền props assignments, khi thay dổi auto update preview */}
                <UserPermission
                  selectedSection={selectedSection}
                  loadPreview={loadPreview}
                />
              </div>
            </div>
          )}

          <DocViewer
            editorRef={editorRef}
            selectedSection={selectedSection}
            previewSfdt={previewSfdt}
            isPreviewLoading={isPreviewLoading}
            showNavigationPane={false}
            handleCreated={handleCreated}
            handleContentChange={handleContentChange}
            handleSave={handleSave}
            originalPreview={originalPreview}
          />
        </section>
      </div>
    </main>
  );
};

export default SectionAuthority;
