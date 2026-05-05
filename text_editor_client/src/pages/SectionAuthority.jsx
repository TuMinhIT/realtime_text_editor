import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { extractHeadingAndBodyFromSfdt } from "../utils/sfdtParser";
import sectionService from "../services/sectionService";
import documentService from "../services/documentService";
import SectionAuthorityHeader from "../components/section-authority/SectionAuthorityHeader";
import SectionListSidebar from "../components/section-authority/SectionListSidebar";
import SectionPreviewPanel from "../components/section-authority/SectionPreviewPanel";
import SectionPermissionsPanel from "../components/section-authority/SectionPermissionsPanel";

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
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showNavigationPane, setShowNavigationPane] = useState(true);
  const [originalPreview, setOriginalPreview] = useState("");

  const openPreview = (sfdt) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !sfdt) {
      return;
    }

    editor.open(sfdt);
  };

  //Lấy nội dung document để hiển thị tên tài liệu + contentDocumentContent
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
  
  //Lấy tất cả section của document để hiển thị danh sách section ở cột bên trái và gọi backend dựng preview SFDT tương ứng khi chọn section
  const loadSections = async () => {
    const res = await sectionService.getAllSectionsByDocument(documentId);
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.sections)
          ? res.sections
          : [];

    setSections(list);
  };


  //Lấy danh sách người dùng được gán vào section đang chọn để hiển thị trong cột bên phải
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
    if (!selectedSection?.id) {
      return;
    }

    if (selectedSection.assignments !== undefined) {
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
  }, [previewSfdt]);

  useEffect(() => {
    const editor = editorRef.current?.documentEditor;
    if (editor?.documentEditorSettings) {
      editor.documentEditorSettings.showNavigationPane = showNavigationPane;
    }
  }, [showNavigationPane]);

  const handleCreated = () => {
    openPreview(previewSfdt);
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

      toast.success("Cập nhật quyền thành công");
    } catch {
      toast.error("Không thể cập nhật quyền");
    }
  };

  const handleSave = () => {
    toast.info("Hiện tại màn này mới dựng preview section, chưa có API lưu section.");
  };

  const selectedAssignments = getAssignments(selectedSection);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <span className="loading loading-spinner loading-lg text-blue-600"></span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f1f3f4] text-slate-900">
      <SectionAuthorityHeader
        documentTitle={documentTitle}
        onBack={() => navigate(-1)}
      />

      <div className="mx-auto flex h-[calc(100vh-73px)] w-full max-w-[1600px] gap-4 overflow-hidden p-4">
        <SectionListSidebar
          sections={sections}
          selectedSectionId={selectedSection?.id}
          onSelectSection={handleSelectSection}
          getAssignmentCount={(section) => getAssignments(section).length}
        />

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SectionPreviewPanel
            selectedSection={selectedSection}
            errorMessage={errorMessage}
            isDirty={isDirty}
            isPreviewLoading={isPreviewLoading}
            sectionHeading={sectionHeading}
            sectionBody={sectionBody}
            showNavigationPane={showNavigationPane}
            onToggleNavigationPane={() =>
              setShowNavigationPane((current) => !current)
            }
            onSave={handleSave}
            editorRef={editorRef}
            onCreated={handleCreated}
            onContentChange={handleContentChange}
            previewSfdt={previewSfdt}
          />

          <SectionPermissionsPanel
            selectedSection={selectedSection}
            assignments={selectedAssignments}
            newUserEmail={newUserEmail}
            isAddingUser={isAddingUser}
            onNewUserEmailChange={setNewUserEmail}
            onAddUser={handleAddUser}
            onRemoveUser={handleRemoveUser}
            onTogglePermission={handleTogglePermission}
          />
        </div>
      </div>
    </main>
  );
};

export default SectionAuthority;
