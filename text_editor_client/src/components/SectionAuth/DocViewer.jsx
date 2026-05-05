import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Plus, Trash2, Users } from "lucide-react";
import { toast } from "react-toastify";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";
import { extractHeadingAndBodyFromSfdt } from "../../utils/sfdtParser";
import sectionService from "../../services/sectionService";
import documentService from "../../services/documentService";

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
  return Array.isArray(section?.assignments) ? section.assignments : [];
};

const DocViewer = ({ documentId, showNavigationPane }) => {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [sections, setSections] = useState([]);
  const [document, setDocument] = useState(null);
  const [documentTitle, setDocumentTitle] = useState(
    location.state?.documentTitle || "Tài liệu",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionHeading, setSectionHeading] = useState("");
  const [sectionBody, setSectionBody] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);

  const loadDocument = async () => {
    const result = await documentService.getDocumentContent(documentId);
    if (result.success) {
      const loadedDocument = result.data;
      setDocument(loadedDocument);
      setDocumentTitle(
        loadedDocument?.title || location.state?.documentTitle || "Tài liệu",
      );
      return;
    }

    setErrorMessage(result.message || "Không tải được nội dung tài liệu.");
  };

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
    if (!selectedSection) {
      setSectionHeading("");
      setSectionBody("");
      return;
    }

    const content = normalizeJson(
      selectedSection.jsonContent || selectedSection.content,
    );

    try {
      const { heading, body } = extractHeadingAndBodyFromSfdt(content);
      setSectionHeading(heading || selectedSection.title || "");
      setSectionBody(body || "");
    } catch {
      setSectionHeading(selectedSection.title || "");
      setSectionBody("");
    }

    openSelectedSection(selectedSection);
    setIsDirty(false);
  }, [selectedSection]);

  useEffect(() => {
    const editor = editorRef.current?.documentEditor;
    if (editor?.documentEditorSettings) {
      editor.documentEditorSettings.showNavigationPane = showNavigationPane;
    }
  }, [showNavigationPane]);

  const handleCreated = () => {
    const editor = editorRef.current?.documentEditor;
    const content = normalizeJson(
      section?.jsonContent || section?.content || document?.jsonContent,
    );

    if (!editor || !content) {
      return;
    }

    editor.open(content);
  };

  const handleContentChange = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !selectedSection) {
      return;
    }

    const currentSerialized = normalizeJson(editor.serialize());
    const originalSerialized = normalizeJson(
      selectedSection.jsonContent || selectedSection.content,
    );

    setIsDirty(currentSerialized !== originalSerialized);
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
      setIsDirty(true);
    } catch {
      toast.error("Không thể thêm người dùng");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = async (permissionId) => {
    if (!selectedSection) return;

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
      setIsDirty(true);
    } catch {
      toast.error("Không thể xóa quyền");
    }
  };

  const handleTogglePermission = async (permissionId, permissionType) => {
    if (!selectedSection) return;

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
      setIsDirty(true);
    } catch {
      toast.error("Không thể cập nhật quyền");
    }
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col  gap-4 overflow-y-scroll">
      <div className="grid min-h-0 h-300 flex-1 gap-4 ">
        <div className="min-h-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <DocumentEditorContainerComponent
            ref={editorRef}
            height="100%"
            enableToolbar={false}
            showPropertiesPane={false}
            created={handleCreated}
            contentChange={handleContentChange}
            documentEditorSettings={{
              showNavigationPane,
            }}
            serviceUrl={SERVICE_URL}
          />
        </div>
      </div>
    </section>
  );
};

export default DocViewer;
