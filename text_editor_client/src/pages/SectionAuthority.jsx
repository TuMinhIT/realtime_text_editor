import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Plus, Trash2, Users } from "lucide-react";
import { toast } from "react-toastify";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";
import { extractHeadingAndBodyFromSfdt } from "../utils/sfdtParser";
import sectionService from "../services/sectionService";
import documentService from "../services/documentService";

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

const getAssignments = (section) => {
  if (Array.isArray(section?.assignments)) {
    return section.assignments;
  }

  if (Array.isArray(section?.users)) {
    return section.users;
  }

  return [];
};

const mapPermissionToAssignment = (item) => {
  const permission = (item?.permission || "").toLowerCase();

  return {
    id: item?.userId || item?.id || `${item?.userEmail || "user"}-${permission}`,
    userId: item?.userId || item?.id,
    userEmail: item?.userEmail || "",
    userName: item?.userName || item?.fullName || item?.userEmail || "",
    permission: item?.permission || "",
    canEdit: permission === "edit" || permission === "owner",
    canDelete: permission === "owner",
  };
};

const canEditSection = (section) => {
  const assignments = getAssignments(section);

  if (!assignments.length) {
    return false;
  }

  return assignments.some((assignment) => assignment.canEdit);
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
  const [sectionHeading, setSectionHeading] = useState("");
  const [sectionBody, setSectionBody] = useState("");
  const [previewSfdt, setPreviewSfdt] = useState("");
  const [originalPreview, setOriginalPreview] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showNavigationPane, setShowNavigationPane] = useState(true);

  const openPreview = (sfdt) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !sfdt) {
      return;
    }

    editor.open(sfdt);
  };

  const applyReadOnlyMode = (section) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor) {
      return;
    }

    try {
      editor.isReadOnly = !canEditSection(section);
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

  const loadSectionUsers = async (sectionId) => {
    try {
      const result = await sectionService.getSectionUsers(sectionId);
      const users = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      const assignments = users.map(mapPermissionToAssignment);

      setSections((current) =>
        current.map((section) =>
          section.id === sectionId ? { ...section, assignments } : section,
        ),
      );

      setSelectedSection((current) =>
        current?.id === sectionId ? { ...current, assignments } : current,
      );
    } catch {
      setSections((current) =>
        current.map((section) =>
          section.id === sectionId ? { ...section, assignments: [] } : section,
        ),
      );
    }
  };

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

    setSelectedSection((current) => {
      if (!current) {
        return sections[0];
      }

      return (
        sections.find((section) => section.id === current.id) || sections[0]
      );
    });
  }, [sections]);

  useEffect(() => {
    if (!selectedSection?.id || selectedSection.assignments !== undefined) {
      return;
    }

    loadSectionUsers(selectedSection.id);
  }, [selectedSection?.id, selectedSection?.assignments]);

  useEffect(() => {
    if (!selectedSection || !documentId) {
      setSectionHeading("");
      setSectionBody("");
      setPreviewSfdt("");
      setOriginalPreview("");
      setIsDirty(false);
      return;
    }

    let isActive = true;

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

        const preview = await sectionService.previewSection(
          documentId,
          sectionContent,
        );

        const normalizedPreview = normalizeJson(preview);

        if (!normalizedPreview) {
          throw new Error("Backend không trả về SFDT preview hợp lệ.");
        }

        if (!isActive) {
          return;
        }

        setPreviewSfdt(normalizedPreview);
        setOriginalPreview(normalizedPreview);

        try {
          const { heading, body } = extractHeadingAndBodyFromSfdt(
            normalizedPreview,
          );
          setSectionHeading(heading || selectedSection.title || "");
          setSectionBody(body || "");
        } catch {
          setSectionHeading(selectedSection.title || "");
          setSectionBody("");
        }

        setIsDirty(false);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setPreviewSfdt("");
        setOriginalPreview("");
        setSectionHeading(selectedSection.title || "");
        setSectionBody("");
        setErrorMessage(
          error?.message || "Không thể dựng preview section từ backend.",
        );
      } finally {
        if (isActive) {
          setIsPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isActive = false;
    };
  }, [selectedSection, documentId]);

  useEffect(() => {
    openPreview(previewSfdt);
    applyReadOnlyMode(selectedSection);
  }, [previewSfdt, selectedSection?.id, selectedSection?.assignments]);

  useEffect(() => {
    const editor = editorRef.current?.documentEditor;
    if (editor?.documentEditorSettings) {
      editor.documentEditorSettings.showNavigationPane = showNavigationPane;
    }
  }, [showNavigationPane]);

  const handleCreated = () => {
    openPreview(previewSfdt);
    applyReadOnlyMode(selectedSection);
  };

  const handleContentChange = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !selectedSection) {
      return;
    }

    const currentSerialized = normalizeJson(editor.serialize());
    setIsDirty(currentSerialized !== originalPreview);
  };

  const handleSelectSection = (section) => {
    setSelectedSection(section);
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !selectedSection) {
      toast.warn("Vui lòng nhập email người dùng");
      return;
    }

    setIsAddingUser(true);

    try {
      const newPermission = {
        id: `perm-${Date.now()}`,
        userId: `user-${Date.now()}`,
        userEmail: newUserEmail.trim(),
        userName: newUserEmail.split("@")[0],
        canEdit: true,
        canDelete: false,
      };

      setSections((current) =>
        current.map((section) =>
          section.id === selectedSection.id
            ? {
                ...section,
                assignments: [...getAssignments(section), newPermission],
              }
            : section,
        ),
      );

      setSelectedSection((current) =>
        current
          ? {
              ...current,
              assignments: [...getAssignments(current), newPermission],
            }
          : current,
      );

      setNewUserEmail("");
      setIsDirty(true);
      toast.success("Đã thêm quyền cho người dùng");
    } catch {
      toast.error("Không thể thêm người dùng");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = async (permissionId) => {
    if (!selectedSection) {
      return;
    }

    try {
      setSections((current) =>
        current.map((section) =>
          section.id === selectedSection.id
            ? {
                ...section,
                assignments: getAssignments(section).filter(
                  (assignment) => assignment.id !== permissionId,
                ),
              }
            : section,
        ),
      );

      setSelectedSection((current) =>
        current
          ? {
              ...current,
              assignments: getAssignments(current).filter(
                (assignment) => assignment.id !== permissionId,
              ),
            }
          : current,
      );

      setIsDirty(true);
      toast.success("Đã xóa quyền");
    } catch {
      toast.error("Không thể xóa quyền");
    }
  };

  const handleTogglePermission = async (permissionId, permissionType) => {
    if (!selectedSection) {
      return;
    }

    try {
      const updatedAssignments = getAssignments(selectedSection).map(
        (assignment) =>
          assignment.id === permissionId
            ? { ...assignment, [permissionType]: !assignment[permissionType] }
            : assignment,
      );

      setSections((current) =>
        current.map((section) =>
          section.id === selectedSection.id
            ? { ...section, assignments: updatedAssignments }
            : section,
        ),
      );

      setSelectedSection((current) =>
        current ? { ...current, assignments: updatedAssignments } : current,
      );

      setIsDirty(true);
      toast.success("Cập nhật quyền thành công");
    } catch {
      toast.error("Không thể cập nhật quyền");
    }
  };

  const handleSave = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !selectedSection) {
      return;
    }

    setIsSaving(true);

    try {
      const serialized = normalizeJson(editor.serialize());

      setSections((current) =>
        current.map((section) =>
          section.id === selectedSection.id
            ? {
                ...section,
                content: serialized,
                jsonContent: serialized,
              }
            : section,
        ),
      );

      setSelectedSection((current) =>
        current
          ? {
              ...current,
              content: serialized,
              jsonContent: serialized,
            }
          : current,
      );

      setPreviewSfdt(serialized);
      setOriginalPreview(serialized);
      setIsDirty(false);
      toast.success("Đã lưu section trong trạng thái hiện tại.");
    } catch {
      toast.error("Không thể lưu nội dung section.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAssignments = getAssignments(selectedSection);
  const canEditSelectedSection = canEditSection(selectedSection);

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

            {sections.map((section) => {
              const indentPx = Math.max(0, (section.level || 1) - 1) * 12;
              const isSelected = selectedSection?.id === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleSelectSection(section)}
                  style={{ marginLeft: indentPx }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
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
                      <div className="mt-1 text-xs text-slate-500">
                        {getAssignments(section).length} người được gán
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

        <section className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedSection?.title || "Chưa chọn section"}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isDirty
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {isDirty ? "Chưa lưu" : "Đã đồng bộ"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      canEditSelectedSection
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {canEditSelectedSection ? "Có thể chỉnh sửa" : "Chỉ xem"}
                  </span>

                  {isPreviewLoading ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Đang dựng preview...
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {sectionHeading || "Tiêu đề section"}
                </p>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {sectionBody ||
                    "Nội dung section sẽ hiển thị trong khung editor bên dưới."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowNavigationPane((current) => !current)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                >
                  {showNavigationPane ? "Ẩn heading" : "Hiện heading"}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !selectedSection || !canEditSelectedSection}
                  className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Đang lưu..." : "Lưu section"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-h-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {selectedSection ? (
                isPreviewLoading && !previewSfdt ? (
                  <div className="flex h-full min-h-[520px] items-center justify-center px-6 text-center text-sm text-slate-500">
                    Đang gọi backend để dựng preview section...
                  </div>
                ) : previewSfdt ? (
                  <DocumentEditorContainerComponent
                    ref={editorRef}
                    height="100%"
                    enableToolbar
                    created={handleCreated}
                    contentChange={handleContentChange}
                    documentEditorSettings={{
                      showNavigationPane,
                    }}
                    serviceUrl={SERVICE_URL}
                  >
                    <Inject services={[Toolbar]} />
                  </DocumentEditorContainerComponent>
                ) : (
                  <div className="flex h-full min-h-[520px] items-center justify-center px-6 text-center text-sm text-slate-500">
                    Không thể dựng preview cho section này.
                  </div>
                )
              ) : (
                <div className="flex h-full min-h-[520px] items-center justify-center px-6 text-center text-sm text-slate-500">
                  Chọn một section để mở nội dung và chỉnh sửa.
                </div>
              )}
            </div>

            <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Quyền section
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Danh sách người được gán vào section đang chọn.
                </p>
              </div>

              <div className="border-b border-slate-200 p-4">
                <div className="flex gap-2">
                  <input
                    value={newUserEmail}
                    onChange={(event) => setNewUserEmail(event.target.value)}
                    placeholder="email@domain.com"
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#1a73e8]"
                  />
                  <button
                    type="button"
                    onClick={handleAddUser}
                    disabled={isAddingUser}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus size={16} />
                    {isAddingUser ? "Đang thêm" : "Thêm"}
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {selectedSection ? (
                  selectedAssignments.length > 0 ? (
                    selectedAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">
                              {assignment.userName || assignment.userEmail}
                            </div>
                            <div className="mt-1 truncate text-xs text-slate-500">
                              {assignment.userEmail}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveUser(assignment.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-red-600"
                            aria-label="Xóa quyền"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePermission(assignment.id, "canEdit")
                            }
                            className={`rounded-full px-3 py-1 transition ${
                              assignment.canEdit
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            Edit: {assignment.canEdit ? "Bật" : "Tắt"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePermission(assignment.id, "canDelete")
                            }
                            className={`rounded-full px-3 py-1 transition ${
                              assignment.canDelete
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            Delete: {assignment.canDelete ? "Bật" : "Tắt"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      Section này chưa có người được gán.
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    Hãy chọn một section ở cột bên trái.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
};

export default SectionAuthority;
