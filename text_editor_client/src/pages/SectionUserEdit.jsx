import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookA,
  Lock,
  Menu,
  X,
  Plus,
  Users,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-toastify";

import sectionService from "../services/sectionService";
import documentService from "../services/documentService";
import { sessionService } from "../services/sessionService";
import DocViewer from "../components/SectionAuth/DocViewer";
import UserPermission from "../components/SectionAuth/UserPermission";

import DocEdit from "../components/SectionUser/DocEdit";

//Thêm realtime service:
import { signalRService } from "../services/signalRService";

const SERVICE_URL = import.meta.env.VITE_API_URL + "/document";

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

//Helper hiện số người đang xem:
const getInitials = (name) => {
  if (!name) {
    return "?";
  }

  return name
    .trim()
    .split(" ")
    .map((x) => x[0])
    .slice(-2)
    .join("")
    .toUpperCase();
};

const SectionAuthority = () => {
  const location = useLocation();
  const { documentId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
  const [assignment, setAssignment] = useState(null);
  const [openAside, setOpenAside] = useState(true);

  //Phục vụ realtime: lắng nghe sự kiện update từ server để tự động reload nội dung section khi có thay đổi từ người khác
  const [presence, setPresence] = useState(null);
  const [lockState, setLockState] = useState(null);
  const [hasLockRequested, setHasLockRequested] = useState(false);

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

  const loadUserAssignments = async () => {
    if (!selectedSection) {
      setAssignment(null);
      return;
    }

    const currentUser = sessionService.getCurrentUser();
    if (!currentUser?.id) {
      setAssignment(null);
      return;
    }

    try {
      const result = await sectionService.getUserAssignments({
        userId: currentUser.id,
        sectionId: selectedSection.id,
      });

      if (!result) {
        setAssignment(null);
        return;
      }

      setAssignment(result);
    } catch (err) {
      setAssignment(null);
    }
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
        await Promise.all([loadSections()]);
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
    if (!sections.length) return;

    setSelectedSection(sections.find((s) => s.level === 2) || sections[0]);

    setIsInitialized(true);
  }, [sections]);

  //Tự động realtime khi mới vào document:
  useEffect(() => {
    if (!selectedSection?.id) {
      return;
    }

    const joinRealtime = async () => {
      try {
        await signalRService.joinSection(selectedSection.id);

        console.log("[Realtime] auto joined:", selectedSection.id);
      } catch (err) {
        console.error("[Realtime] auto join error", err);
      }
    };

    joinRealtime();

    return () => {
      signalRService.leaveCurrentSection();
    };
  }, [selectedSection?.id]);

  //Listen realtime event: (Để hiện số người đang xem)
  useEffect(() => {
    const setupRealtime = async () => {
      await signalRService.onPresenceUpdated((data) => {
        console.log("PRESENCE", data);

        setPresence(data);
      });

      await signalRService.onLockUpdated((data) => {
        console.log("LOCK", data);

        setLockState(data);
      });
    };

    setupRealtime();

    return () => {
      signalRService.offPresenceUpdated();

      signalRService.offLockUpdated();
    };
  }, []);

  //Lock realtime:
  useEffect(() => {
    signalRService.onLockUpdated((data) => {
      console.log("LOCK UPDATE:", data);

      setLockState(data);
    });

    return () => {
      signalRService.offLockUpdated();
    };
  }, []);

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
      if (!selectedSection?.id) return;

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
    if (!lockState || !selectedSection?.id) {
      return;
    }

    if (lockState.sectionId !== selectedSection.id) {
      return;
    }

    const currentUser = sessionService.getCurrentUser();

    const isLockedByMe = lockState.lockedByUserId === currentUser?.id;

    // mình giữ lock -> edit
    if (isLockedByMe) {
      applyReadOnlyMode(false);

      return;
    }

    // người khác giữ lock
    if (lockState.isLocked) {
      applyReadOnlyMode(true);

      toast.info(
        `${lockState.lockedByUsername}
       đang chỉnh sửa`,
      );
    }
  }, [lockState, selectedSection?.id]);

  //Clean up khi rời khỏi section hoặc document:
  useEffect(() => {
    return () => {
      if (selectedSection?.id) {
        signalRService.releaseEditSession(selectedSection.id);

        signalRService.leaveCurrentSection();
      }
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (!selectedSection || !documentId) return;

    loadPreview();
    loadUserAssignments();
  }, [selectedSection, documentId, isInitialized]);

  useEffect(() => {
    if (!previewSfdt || !selectedSection) return;

    openPreview(previewSfdt);
    const canEdit = assignment?.permission == 1;
    applyReadOnlyMode(!canEdit);
  }, [previewSfdt, selectedSection?.id, assignment?.permission]);

  const handleCreated = () => {
    openPreview(previewSfdt);
    applyReadOnlyMode(true);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = async () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !selectedSection) {
      return;
    }

    if (!assignment?.permission == 1) {
      toast.error("Bạn không có quyền chỉnh sửa section này.");
      return;
    }

    setIsSaving(true);
    try {
      const serialized = normalizeJson(editor.serialize());

      // // Lưu nội dung section qua endpoint document/section content
      await sectionService.updateSectionContent(selectedSection.id, serialized);

      // Reload sections để cập nhật dữ liệu trong selectedSection
      await loadSections();
      await loadDocument();

      setIsDirty(false);
      toast.success("Lưu section thành công.");
    } catch (err) {
      toast.error(err?.message || "Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !selectedSection) {
      return;
    }

    //Request lock khi bắt đầu edit:
    if (assignment?.permission == 1 && !hasLockRequested) {
      try {
        signalRService.requestEditSession(selectedSection.id);

        setHasLockRequested(true);

        console.log("Requested edit lock");
      } catch (err) {
        console.error("Request lock failed", err);
      }
    }

    const currentSerialized = normalizeJson(editor.serialize());
    setIsDirty(currentSerialized !== normalizeJson(originalPreview));
  };

  const handleSelectSection = async (section) => {
    try {
      // click lại section cũ
      if (selectedSection?.id === section.id) {
        return;
      }

      /* =========
       LEAVE OLD
    ========= */

      if (selectedSection?.id) {
        // release lock cũ
        signalRService.releaseEditSession(selectedSection.id);

        // leave realtime room
        signalRService.leaveCurrentSection();

        console.log("Left section", selectedSection.id);
      }

      /* =========
       RESET STATE
    ========= */

      setHasLockRequested(false);

      setLockState(null);

      /* =========
       UPDATE UI
    ========= */

      setSelectedSection(section);

      /* =========
       JOIN NEW
    ========= */

      await signalRService.joinSection(section.id);

      console.log("Joined section", section.id);
    } catch (err) {
      console.error(err);

      console.log(
        `Không thể tham gia section ${section.id}
      để realtime.`,
      );
    }
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

            <button
              type="button"
              onClick={() => setOpenAside(!openAside)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
              aria-label="Toggle sidebar"
            >
              {openAside ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a73e8] text-white">
              <BookA size={16} />
            </div>

            <div>
              <span className="text-slate-500">Văn bản:</span>{" "}
              <span className="font-medium text-slate-900">
                {documentTitle}
              </span>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-wrap gap-3 px-4 py-1 ">
        {openAside && (
          <aside
            className={` max-w-[360px] overflow-y-scroll h-screen  flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition-all duration-300  `}
          >
            <div className="border-b border-slate-200 px-4 py-4">
              <div className="flex flex-row justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-[#1a73e8]" />
                  <h2 className="text-base font-semibold">Sections</h2>
                </div>
                <button
                  onClick={() => setOpenAside(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 md:hidden"
                  aria-label="Close sidebar"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Chọn section để xem và chỉnh nội dung tương ứng.
              </p>
            </div>

            <div className="flex-1 space-y-3  p-3">
              {sections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Chưa có section nào.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/overview/${documentId}`)}
                  className={
                    "w-full rounded-2xl  border px-2 py-1 text-left transition border-slate-200 bg-gray-50 hover:border-slate-300 hover:bg-slate-50"
                  }
                >
                  <div className=" gap-3 flex flex-row items-center">
                    <div className="truncate text-md  font-bold text-slate-900">
                      Tổng quan
                    </div>
                    <ArrowRight className="flex" size={18} />
                  </div>
                </button>
              )}

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
        )}

        {/* header Nọi dung */}
        <section className="flex max-w-7xl m-auto min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          {selectedSection && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <div className="flex  items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedSection?.title || "Chưa chọn section"}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {/* ========= USERS ========= */}
                  <div className="flex items-center">
                    {presence?.users?.map((user, index) => {
                      const isEditing = user.isEditing;

                      return (
                        <div
                          key={user.userId}
                          title={
                            user.username +
                            (isEditing ? " đang chỉnh sửa..." : " đang xem...")
                          }
                          style={{
                            marginLeft: index === 0 ? 0 : -8,
                          }}
                          className="
              relative
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              border-2
              border-white
              bg-blue-500
              text-xs
              font-semibold
              text-white
              shadow
            "
                        >
                          {getInitials(user.username)}

                          <span
                            className={`
                absolute
                bottom-0
                right-0
                h-3
                w-3
                rounded-full
                border-2
                border-white
                ${isEditing ? "bg-orange-500" : "bg-green-500"}
              `}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* ========= LOCK UI ========= */}
                  {lockState?.isLocked && (
                    <div
                      className={`
      flex
      items-center
      gap-2
      rounded-full
      border
      px-3
      py-1
      text-sm
      ${
        lockState.lockedByUserId === sessionService.getCurrentUser()?.id
          ? `
            border-green-200
            bg-green-50
            text-green-700
          `
          : `
            border-amber-200
            bg-amber-50
            text-amber-700
          `
      }
    `}
                    >
                      <Lock size={14} />

                      {lockState.lockedByUserId ===
                      sessionService.getCurrentUser()?.id ? (
                        <span>Bạn đang chỉnh sửa</span>
                      ) : (
                        <span>{lockState.lockedByUsername} đang chỉnh sửa</span>
                      )}
                    </div>
                  )}

                  {/* ========= SAVE ========= */}
                  {assignment?.permission == 1 ? (
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !isDirty}
                      className="inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-1 text-sm font-medium text-white transition disabled:opacity-50"
                    >
                      {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  ) : (
                    <div className="text-sm text-slate-500">Chỉ xem</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DocEdit
            editorRef={editorRef}
            selectedSection={selectedSection}
            previewSfdt={previewSfdt}
            isPreviewLoading={isPreviewLoading}
            showNavigationPane={true}
            handleCreated={handleCreated}
            handleContentChange={handleContentChange}
            handleSave={handleSave}
            originalPreview={originalPreview}
            canEdit={assignment?.permission == 1}
          />
        </section>
      </div>
    </main>
  );
};

export default SectionAuthority;
