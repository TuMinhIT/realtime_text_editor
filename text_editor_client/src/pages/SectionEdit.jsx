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

const SectionEdit = ({ documentId, tempSection }) => {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  // autosave:
  const autoSaveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [section, setSection] = useState(null);

  const [previewSfdt, setPreviewSfdt] = useState("");
  const [originalPreview, setOriginalPreview] = useState("");

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [permission, setPermission] = useState(0);

  const sectionRef = useRef(null);
  const isDirtyRef = useRef(false);
  const [presence, setPresence] = useState(null);
  const [hasLockRequested, setHasLockRequested] = useState(false);
  const [lockState, setLockState] = useState(null);

  const userId = sessionService.getCurrentUser()?.id;

  const { onSectionUpdated } = useRealtimeSectionUpdate({
    documentId,
    selectedSectionRef: sectionRef,
    isDirtyRef,
  });

  useSignalRListeners({
    onPresence: setPresence,
    onLock: setLockState,
    onSectionUpdated,
  });

  useEffect(() => {
    sectionRef.current = section;
  }, [section]);

  const openPreview = (sfdt) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !sfdt) {
      return;
    }
    editor.open(sfdt);
    editor.isReadOnly = canCurrentUserEdit();
  };
  // thiết lập có dc chỉnh sửa hay không
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

  // init data
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!tempSection?.id) {
        if (mounted) setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const newSection = await sectionService.getSectionbyId(
          tempSection.id,
          userId,
        );

        if (!mounted) {
          return;
        }

        const sfdt = normalizeJson(newSection?.content);

        setPreviewSfdt(sfdt);
        setOriginalPreview(sfdt);
        setSection(newSection);
        setPermission(newSection.permission);

        await loadPreview(newSection);
      } catch (err) {
        console.error("Error loading preview on init", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [tempSection?.id, userId, documentId]);

  useEffect(() => {
    setPresence(null);
    setLockState(null);
    setHasLockRequested(false);
  }, [tempSection?.id]);

  useEffect(() => {
    if (!section?.id) {
      return;
    }

    let cancelled = false;

    const requestLock = async () => {
      if (permission !== 1) {
        setHasLockRequested(false);
        return;
      }

      try {
        await signalRService.requestEditSession(section.id);

        if (!cancelled) {
          setHasLockRequested(true);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        setHasLockRequested(false);
        applyReadOnlyMode(true);
        toast.info("Section này đang được người khác chỉnh sửa.");
      }
    };

    requestLock();

    return () => {
      cancelled = true;
    };
  }, [permission, section?.id]);

  const refetch = async () => {
    try {
      const newSection = await sectionService.getSectionbyId(
        tempSection.id,
        userId,
      );
      const sfdt = normalizeJson(newSection?.content);
      setPreviewSfdt(sfdt);
      setOriginalPreview(sfdt);
      setSection(newSection);
      setPermission(newSection.permission);

      await loadPreview(newSection);
    } catch (err) {
      console.error("Error loading preview on init", err);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Realtime: join selected section
  useSectionJoin(tempSection.id);

  // Hàm dựng preview section - load section mới:
  const loadPreview = async (section) => {
    if (!section?.id) return;
    setIsPreviewLoading(true);

    try {
      const preview = await sectionService.previewSection(
        section.id,
        section.content,
        documentId,
      );
      const sfdt = normalizeJson(preview?.sfdtContent);
      // Preview hiện tại
      setPreviewSfdt(sfdt);
      setIsDirty(false);
    } catch (error) {
      console.error("Load preview error:", error);
      setPreviewSfdt("");
      setOriginalPreview("");
      setErrorMessage(
        error?.message || "Không thể dựng preview section từ backend.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // useEffect(() => {
  //   if (!lockState || !section?.id) {
  //     applyReadOnlyMode(false);
  //     return;
  //   }

  //   if (lockState.sectionId !== section.id) {
  //     applyReadOnlyMode(false);
  //     return;
  //   }

  //   const currentUser = sessionService.getCurrentUser();

  //   const isLockedByMe = lockState.lockedByUserId === currentUser?.id;

  //   // người khác đang edit
  //   if (lockState.isLocked && !isLockedByMe) {
  //     applyReadOnlyMode(true);

  //     toast.info(`${lockState.lockedByUsername} đang chỉnh sửa`);

  //     return;
  //   }

  //   // còn lại cho edit
  //   applyReadOnlyMode(false);
  // }, [lockState, section?.id]);

  // Release lock + leave room when switching section/unmounting
  // useEffect(() => {
  //   return () => {
  //     if (section?.id) {
  //       signalRService.releaseEditSession(section.id);
  //     }
  //     signalRService.leaveCurrentSection();
  //     clearRemoteCursors();
  //     setHasLockRequested(false);
  //   };
  // }, [section?.id, clearRemoteCursors, setHasLockRequested]);

  //Helper user có quyền edit hay không:
  const canCurrentUserEdit = () => {
    if (permission !== 1 || !hasLockRequested) {
      return false;
    }
    if (!lockState?.isLocked) {
      return true;
    }
    return lockState.lockedByUserId === userId;
  };

  useEffect(() => {
    if (!section?.id) {
      return;
    }

    applyReadOnlyMode(!canCurrentUserEdit());
  }, [hasLockRequested, lockState, permission, section?.id]);

  // load lại sycnfusion view
  useEffect(() => {
    if (!previewSfdt) return;
    openPreview(previewSfdt);
    applyReadOnlyMode(!canCurrentUserEdit());
  }, [previewSfdt]);

  const handleCreated = () => {
    openPreview(previewSfdt);
    applyReadOnlyMode(!canCurrentUserEdit());
  };

  // useEffect(() => {
  //   if (!lockState || !section?.id) {
  //     return;
  //   }

  //   if (lockState.sectionId !== section.id) {
  //     return;
  //   }

  //   const currentUser = sessionService.getCurrentUser();
  //   const isLockedByMe = lockState.lockedByUserId === currentUser?.id;

  //   if (lockState.isLocked && !isLockedByMe) {
  //     toast.info(`${lockState.lockedByUsername} đang chỉnh sửa`);
  //   }
  // }, [lockState, section?.id]);

  //Cleanup timeout khi unmount:
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // save realtime:
  const saveRealtime = async (sectionId) => {
    const editor = editorRef.current?.documentEditor;
    if (!editor || !sectionId || !canCurrentUserEdit()) {
      toast.error("Không thể lưu");
      return;
    }
    if (isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      const serialized = normalizeJson(editor.serialize());
      await sectionService.updateSectionContent(sectionId, serialized);
      console.log("[Realtime] autosaved");
    } catch (err) {
      console.error("Realtime save failed", err);
    } finally {
      isSavingRef.current = false;
      setIsDirty(false);
    }
  };

  const handleContentChange = () => {
    //Kiểm tra user có quyền edit hay không:
    const editor = editorRef.current?.documentEditor;
    if (!editor || !section) {
      return;
    }
    //Request lock khi bắt đầu edit:
    // if (assignment?.permission == 1 && !hasLockRequested) {
    //   try {
    //     signalRService.requestEditSession(section.id);
    //     setHasLockRequested(true);
    //     console.log("Requested edit lock");
    //   } catch (err) {
    //     console.error("Request lock failed", err);
    //   }
    // }

    const currentSerialized = normalizeJson(editor.serialize());
    const dirty = currentSerialized !== normalizeJson(originalPreview);
    setIsDirty(dirty);

    //  AUTO SAVE (debounce 1.5s)
    if (canCurrentUserEdit() && dirty) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      // gọi save 1500 ms mỗi lần
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveRealtime(section.id);
      }, 1500);
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
    <section className="flex  max-w-7xl m-auto min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      {section && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <div className="flex  items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <h2 className="text-lg font-semibold text-slate-900">
                {section?.title || "Chưa chọn section"}
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
                      className="relative flex h-9 w-9 items-center justify-center rounded-full border-2
                              border-white bg-blue-500 text-xs font-semibold text-white shadow"
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
                  className={`flex items-centergap-2 rounded-full border px-3 py-1 text-sm
                              ${
                                lockState.lockedByUserId === userId
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

                  {lockState.lockedByUserId === userId ? (
                    <span>Bạn đang chỉnh sửa</span>
                  ) : (
                    <span>{lockState.lockedByUsername} đang chỉnh sửa</span>
                  )}
                </div>
              )}

              {canCurrentUserEdit() ? (
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
              ) : (
                <div className=" py-1 px-2 text-gray-500">Chỉ xem</div>
              )}
            </div>
          </div>
        </div>
      )}

      <DocEdit
        editorRef={editorRef}
        showNavigationPane={true}
        handleCreated={handleCreated}
        handleContentChange={handleContentChange}
        canEdit={canCurrentUserEdit()}
      />
    </section>
  );
};

export default SectionEdit;
