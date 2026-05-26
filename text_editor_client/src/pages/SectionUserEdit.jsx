import React, { useEffect, useRef, useState, useCallback } from "react";
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
  File,
  ArrowBigDown,
} from "lucide-react";
import { toast } from "react-toastify";

import sectionService from "../services/sectionService";
import documentService from "../services/documentService";
import { sessionService } from "../services/sessionService";
import DocViewer from "../components/SectionAuth/DocViewer";
import UserPermission from "../components/SectionAuth/UserPermission";
import ProofFileSection from "../components/SectionAuth/ProofFileSection";

import DocEdit from "../components/SectionUser/DocEdit";

//Thêm realtime service:
import { signalRService } from "../services/signalRService";

//Tách hooks realtime - để dùng chung cho nhiều component khác nhau:
import useSignalRListeners from "../hooks/realtime/useSignalRListeners";
import useSectionJoin from "../hooks/realtime/useSectionJoin";
import ProofFileTab from "../components/SectionUser/ProofFileTab";
import useRealtimePresence from "../hooks/realtime/useRealtimePresence";
import useRealtimeLock from "../hooks/realtime/useRealtimeLock";
import useRealtimeCursor from "../hooks/realtime/useRealtimeCursor";
import useRealtimeSectionUpdate from "../hooks/realtime/useRealtimeSectionUpdate";

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

  // autosave:
  const autoSaveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);

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
  const [presence, onPresence] = useRealtimePresence();

  const [tab, setTab] = useState("section");

  const selectedSectionRef = useRef(null);
  const isDirtyRef = useRef(false);

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

    setSelectedSection((prev) => {
      if (prev?.id) {
        const exists = sections.find((s) => s.id === prev.id);
        if (exists) return exists;
      }

      return sections.find((s) => s.level === 2) || sections[0];
    });
  }, [sections]);
  //Realtime lock:
  const {
    lockState,
    hasLockRequested,

    setLockState,
    setHasLockRequested,

    onLock,
  } = useRealtimeLock();

  // Realtime: join selected section and register listeners via hooks
  useSectionJoin(selectedSection?.id);

  // Hàm dựng preview section - load section mới:
  const loadPreview = async (section) => {
    if (!section?.id) return;

    setIsPreviewLoading(true);
    setErrorMessage("");

    try {
      const sectionContent = normalizeJson(
        section.content || section.jsonContent,
      );

      const preview = await sectionService.previewSection(
        section.id,
        sectionContent,
        documentId,
      );

      const sfdt = normalizeJson(preview?.sfdtContent);

      // Preview hiện tại
      setPreviewSfdt(sfdt);

      // Gốc để compare dirty
      setOriginalPreview(sfdt);

      // reset dirty khi load section mới
      setIsDirty(false);
    } catch (error) {
      console.error("Load preview error:", error);

      // Nếu load preview thất bại thì không dùng dữ liệu cũ của section khác
      setPreviewSfdt("");
      setOriginalPreview("");
      setErrorMessage(
        error?.message || "Không thể dựng preview section từ backend.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };
  const { remoteCursors, onCursor, clearRemoteCursors } = useRealtimeCursor();

  const { onSectionUpdated } = useRealtimeSectionUpdate({
    documentId,
    selectedSectionRef,
    isDirtyRef,
    setSections,
    setSelectedSection,
   // loadPreview,
  });

  useSignalRListeners({ onPresence, onLock, onCursor, onSectionUpdated });

  useEffect(() => {
    selectedSectionRef.current = selectedSection;
  }, [selectedSection]);

  // useEffect(() => {
  //   if (!lockState || !selectedSection?.id) {
  //     return;
  //   }

  //   if (lockState.sectionId !== selectedSection.id) {
  //     return;
  //   }

  //   const currentUser = sessionService.getCurrentUser();

  //   const isLockedByMe = lockState.lockedByUserId === currentUser?.id;

  //   // mình giữ lock -> edit
  //   if (isLockedByMe) {
  //     applyReadOnlyMode(false);

  //     return;
  //   }

  //   // người khác giữ lock
  //   if (lockState.isLocked) {
  //     applyReadOnlyMode(true);

  //     toast.info(
  //       `${lockState.lockedByUsername}
  //      đang chỉnh sửa`,
  //     );
  //   }
  // }, [lockState, selectedSection?.id]);


  useEffect(() => {
  if (!lockState || !selectedSection?.id) {
    applyReadOnlyMode(false);
    return;
  }

  if (lockState.sectionId !== selectedSection.id) {
    applyReadOnlyMode(false);
    return;
  }

  const currentUser = sessionService.getCurrentUser();

  const isLockedByMe =
    lockState.lockedByUserId === currentUser?.id;

  // người khác đang edit
  if (lockState.isLocked && !isLockedByMe) {
    applyReadOnlyMode(true);

    toast.info(
      `${lockState.lockedByUsername} đang chỉnh sửa`,
    );

    return;
  }

  // còn lại cho edit
  applyReadOnlyMode(false);

}, [lockState, selectedSection?.id]);

  //Clean up khi rời khỏi section hoặc document:
  useEffect(() => {
    return () => {
      if (selectedSection?.id) {
        signalRService.releaseEditSession(selectedSection.id);

        signalRService.leaveCurrentSection();
      }
    };
  }, [selectedSection?.id]);


  //Helper user có quyền edit hay không:
const canCurrentUserEdit = () => {
  const currentUser = sessionService.getCurrentUser();

  return (
    assignment?.permission === 1 &&
    (
      !lockState?.isLocked || // chưa ai lock
      lockState?.lockedByUserId === currentUser?.id // mình giữ lock
    )
  );
};
  // Dirty:

  useEffect(() => {
    if (!selectedSection || !documentId) return;

    loadPreview(selectedSection);
    loadUserAssignments();
  }, [selectedSection, documentId]);

  useEffect(() => {
    if (!previewSfdt || !selectedSection) return;

    openPreview(previewSfdt);
    // const canEdit = assignment?.permission == 1;
    applyReadOnlyMode(!canCurrentUserEdit());
  }, [previewSfdt, selectedSection?.id, assignment?.permission]);

  const handleCreated = () => {
    openPreview(previewSfdt);
    // Mở khóa edit khi editor có quyền được chỉnh sửa
    applyReadOnlyMode(!canCurrentUserEdit());
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const handleSave = async () => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !selectedSection || !canCurrentUserEdit()) {
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

      // Release lock sau khi lưu xong để người khác có thể edit tiếp
      await signalRService.releaseEditSession(selectedSection.id);

      setHasLockRequested(false);

      // Reload sections để cập nhật dữ liệu trong selectedSection
      await loadSections();
      //await loadDocument();

      setOriginalPreview(serialized);
      setIsDirty(false);
      toast.success("Lưu section thành công.");
    } catch (err) {
      toast.error(err?.message || "Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  //Cleanup timeout khi unmount:
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);
  //Tạo hàm save realtime:
  const saveRealtime = async (sectionId) => {
    const editor = editorRef.current?.documentEditor;

    if (!editor || !sectionId || assignment?.permission != 1 || !canCurrentUserEdit()) {
      return;
    }

    if (isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;

      const serialized = normalizeJson(editor.serialize());

      await sectionService.updateSectionContent(sectionId, serialized);


      //reload latest section data:
       const freshSections =
      await sectionService.getAllSectionsByDocument(
        documentId
      );

    setSections(freshSections);


      // Sau khi lưu thành công, cập nhật lại preview và reset dirty
      await signalRService.notifySectionUpdated(sectionId);

      setOriginalPreview(serialized);

      setIsDirty(false);

      console.log("[Realtime] autosaved");
    } catch (err) {
      console.error("Realtime save failed", err);
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleContentChange = () => {

    //Kiểm tra user có quyền edit hay không:

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

    // gửi cursor realtime
    try {
      const selection = editor.selection;

      if (selection?.start) {
        // caret element thật trong Syncfusion
        const caret = document.querySelector(".e-de-blink-cursor");

        if (caret) {
          const rect = caret.getBoundingClientRect();

          signalRService.updateCursor(selectedSection.id, {
            x: rect.left + window.scrollX,

            y: rect.top + window.scrollY,
          });
        }
      }
    } catch (err) {
      console.error("Send cursor error", err);
    }

    const currentSerialized = normalizeJson(editor.serialize());

    const dirty = currentSerialized !== normalizeJson(originalPreview);

    setIsDirty(dirty);

    /* =========
   AUTO SAVE (debounce 1.5s)
========= */

    if (assignment?.permission == 1 && dirty) {
      // clear timer cũ
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      const currentSectionId = selectedSection.id;

      autoSaveTimeoutRef.current = setTimeout(() => {
        saveRealtime(currentSectionId);
      }, 1000);
    }
  };

  const handleSelectSection = async (section) => {
    try {
      // click lại section cũ
      if (isDirty && selectedSection?.id) {
        await saveRealtime(selectedSection.id);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
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

      /* 
       RESET STATE
    */

      setHasLockRequested(false);

      setLockState(null);
      //setremotecursor về rỗng khi chuyển section để tránh hiện cursor của section cũ sang section mới
      clearRemoteCursors();

      /* =========
       UPDATE UI
    ========= */

      setSelectedSection(section);

      /* =========
       JOIN NEW
    ========= */

      // await signalRService.joinSection(section.id);

      // console.log("Joined section", section.id);
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
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setTab("section")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    tab === "section"
                      ? "bg-white text-[#1a73e8] shadow-sm"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                  }`}
                >
                  <Users size={18} />
                  <span>Sections</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTab("proofFile")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    tab === "proofFile"
                      ? "bg-white text-[#1a73e8] shadow-sm"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                  }`}
                >
                  <ArrowBigDown size={18} />
                  <span>Proof File</span>
                </button>
              </div>
            </div>
            {tab == "section" ? (
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
            ) : (
              <div className="p-3">
                <ProofFileTab documentId={documentId} />
              </div>
            )}
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
                  {/* ========= ASSIGNMENT & LOCK STATE ========= */}
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

                  <div
                    className={`
  rounded-full
  px-3
  py-1
  text-sm
  ${isDirty ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}
`}
                  >
                    {isDirty ? "Đang đồng bộ..." : "Đã lưu"}
                  </div>
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
            remoteCursors={remoteCursors} // Truyền remote cursors vào component DocEdit để hiển thị
          />
        </section>
      </div>
    </main>
  );
};

export default SectionAuthority;
