// import React, { useEffect, useRef, useState } from "react";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   ClosedCaption,
//   Lock,
//   Plus,
//   Trash2,
//   TrashIcon,
//   Users,
// } from "lucide-react";
// import { toast } from "react-toastify";
// import {
//   DocumentEditorContainerComponent,
//   Inject,
//   Toolbar,
// } from "@syncfusion/ej2-react-documenteditor";
// import { extractHeadingAndBodyFromSfdt } from "../utils/sfdtParser";
// import sectionService from "../services/sectionService";
// import documentService from "../services/documentService";
// import DocViewer from "../components/SectionAuth/DocViewer";

// const SERVICE_URL =
//   "https://ej2services.syncfusion.com/production/web-services/api/documenteditor/";

// const normalizeJson = (value) => {
//   if (!value) {
//     return "";
//   }

//   if (typeof value === "object") {
//     return JSON.stringify(value);
//   }

//   try {
//     return JSON.stringify(JSON.parse(value));
//   } catch {
//     return value;
//   }
// };

// const getAssignments = (section) => {
//   // return Array.isArray(section?.assignments) ? section.assignments : [];
//   return [{ name: "OKe" }, { name: "Heie" }, { name: "HUEM" }];
// };

// const SectionAuthority = () => {
//   const location = useLocation();
//   const { documentId } = useParams();
//   const navigate = useNavigate();
//   const editorRef = useRef(null);

//   const [sections, setSections] = useState([]);
//   const [document, setDocument] = useState(null);
//   const [documentTitle, setDocumentTitle] = useState(
//     location.state?.documentTitle || "Tài liệu",
//   );
//   const [isLoading, setIsLoading] = useState(true);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [selectedSection, setSelectedSection] = useState(null);
//   const [sectionHeading, setSectionHeading] = useState("");
//   const [sectionBody, setSectionBody] = useState("");
//   const [isDirty, setIsDirty] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [newUserEmail, setNewUserEmail] = useState("");
//   const [isAddingUser, setIsAddingUser] = useState(false);
//   const [showNavigationPane, setShowNavigationPane] = useState(true);

//   const openSelectedSection = (section) => {
//     const editor = editorRef.current?.documentEditor;
//     //chỉ đọc nên set readOnly = true, không cho phép chỉnh sửa
//     // if (editor) {
//     //   editor.isReadOnly = true;
//     // }

//     const content = normalizeJson(
//       section?.jsonContent || section?.content || document?.jsonContent,
//     );

//     if (!editor || !content) {
//       return;
//     }
//     editor.open(content);
//   };

//   const loadDocument = async () => {
//     const result = await documentService.getDocumentContent(documentId);
//     if (result.success) {
//       const loadedDocument = result.data;
//       setDocument(loadedDocument);
//       setDocumentTitle(
//         loadedDocument?.title || location.state?.documentTitle || "Tài liệu",
//       );
//       return;
//     }

//     setErrorMessage(result.message || "Không tải được nội dung tài liệu.");
//   };

//   const loadSections = async () => {
//     const res = await sectionService.getAllSectionsByDocument(documentId);
//     const list = Array.isArray(res)
//       ? res
//       : Array.isArray(res?.data)
//         ? res.data
//         : Array.isArray(res?.sections)
//           ? res.sections
//           : [];

//     setSections(list);
//   };

//   useEffect(() => {
//     if (!documentId) {
//       setErrorMessage("Không tìm thấy documentId trên route.");
//       setIsLoading(false);
//       return;
//     }

//     const loadData = async () => {
//       setIsLoading(true);
//       setErrorMessage("");

//       try {
//         await Promise.all([loadDocument(), loadSections()]);
//       } catch (error) {
//         setErrorMessage(
//           error?.message || "Không tải được dữ liệu section từ backend.",
//         );
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadData();
//   }, [documentId]);

//   useEffect(() => {
//     if (!sections.length) {
//       setSelectedSection(null);
//       return;
//     }

//     setSelectedSection((current) => {
//       if (!current) {
//         return sections[0];
//       }

//       return (
//         sections.find((section) => section.id === current.id) || sections[0]
//       );
//     });
//   }, [sections]);

//   useEffect(() => {
//     if (!selectedSection) {
//       setSectionHeading("");
//       setSectionBody("");
//       return;
//     }

//     const content = normalizeJson(
//       selectedSection.jsonContent || selectedSection.content,
//     );

//     try {
//       const { heading, body } = extractHeadingAndBodyFromSfdt(content);
//       setSectionHeading(heading || selectedSection.title || "");
//       setSectionBody(body || "");
//     } catch {
//       setSectionHeading(selectedSection.title || "");
//       setSectionBody("");
//     }

//     openSelectedSection(selectedSection);
//     setIsDirty(false);

//     // after opening, apply editable range protection for this section
//     try {
//       applyEditableRangeForSelectedSection(selectedSection);
//     } catch {}
//   }, [selectedSection]);

//   useEffect(() => {
//     const editor = editorRef.current?.documentEditor;
//     if (editor?.documentEditorSettings) {
//       editor.documentEditorSettings.showNavigationPane = showNavigationPane;
//     }
//   }, [showNavigationPane]);

//   const handleCreated = () => {
//     openSelectedSection(selectedSection);
//     try {
//       applyEditableRangeForSelectedSection(selectedSection);
//     } catch {}
//   };

//   const handleSelectSection = (section) => {
//     setSelectedSection(section);
//   };

//   const handleAddUser = async () => {
//     setIsAddingUser(true);

//     // try {
//     //   setSections((current) =>
//     //     current.map((section) =>
//     //       section.id === selectedSection.id
//     //         ? {
//     //             ...section,
//     //             assignments: [...getAssignments(section), newPermission],
//     //           }
//     //         : section,
//     //     ),
//     //   );

//     //   setSelectedSection((current) =>
//     //     current
//     //       ? {
//     //           ...current,
//     //           assignments: [...getAssignments(current), newPermission],
//     //         }
//     //       : current,
//     //   );

//     toast.success("Đã thêm quyền cho người dùng");
//     //   setIsDirty(true);
//     // } catch {
//     //   toast.error("Không thể thêm người dùng");
//     // } finally {
//     //   setIsAddingUser(false);
//     // }
//   };

//   const handleRemoveUser = async (permissionId) => {
//     if (!selectedSection) return;

//     try {
//       setSections((current) =>
//         current.map((section) =>
//           section.id === selectedSection.id
//             ? {
//                 ...section,
//                 assignments: getAssignments(section).filter(
//                   (assignment) => assignment.id !== permissionId,
//                 ),
//               }
//             : section,
//         ),
//       );

//       setSelectedSection((current) =>
//         current
//           ? {
//               ...current,
//               assignments: getAssignments(current).filter(
//                 (assignment) => assignment.id !== permissionId,
//               ),
//             }
//           : current,
//       );

//       toast.success("Đã xóa quyền");
//       setIsDirty(true);
//     } catch {
//       toast.error("Không thể xóa quyền");
//     }
//   };

//   const handleTogglePermission = async (permissionId, permissionType) => {
//     if (!selectedSection) return;

//     try {
//       const updatedAssignments = getAssignments(selectedSection).map(
//         (assignment) =>
//           assignment.id === permissionId
//             ? { ...assignment, [permissionType]: !assignment[permissionType] }
//             : assignment,
//       );

//       setSections((current) =>
//         current.map((section) =>
//           section.id === selectedSection.id
//             ? { ...section, assignments: updatedAssignments }
//             : section,
//         ),
//       );

//       setSelectedSection((current) =>
//         current ? { ...current, assignments: updatedAssignments } : current,
//       );

//       toast.success("Cập nhật quyền thành công");
//       setIsDirty(true);
//     } catch {
//       toast.error("Không thể cập nhật quyền");
//     }
//   };

//   // Apply editable region helpers -------------------------------------------------
//   function getPositionFromBlock(editor, targetIndex) {
//     let count = 0;
//     let pos = null;

//     // documentHelper.pages -> page.bodyWidgets -> body.childWidgets -> block
//     (editor?.documentHelper?.pages || []).forEach((page) => {
//       (page.bodyWidgets || []).forEach((body) => {
//         (body.childWidgets || []).forEach((block) => {
//           if (count === targetIndex) {
//             pos = block.firstChild ? block.firstChild.index : block.index;
//           }
//           count++;
//         });
//       });
//     });

//     return pos;
//   }

//   function applyEditableRange(
//     editor,
//     startBlockIndex,
//     endBlockIndex,
//     userName,
//   ) {
//     if (!editor) return;

//     const startPos = getPositionFromBlock(editor, startBlockIndex);
//     const endPos = getPositionFromBlock(editor, endBlockIndex);

//     if (!startPos || !endPos) return;

//     try {
//       // select the range and create an editing region for the current user (or Everyone)
//       editor.selection.selectRange(startPos, endPos);
//       editor.editor.insertEditingRegion(userName || "Everyone");
//     } catch (err) {
//       // ignore - editor API might not be ready yet
//     }
//   }

//   function applyEditableRangeForSelectedSection(section) {
//     const editor = editorRef.current?.documentEditor;
//     if (!editor || !section) return;

//     // Try to protect whole document (read-only) then allow editing region for allowed section
//     try {
//       // enforceProtection will make document read-only; we then open an editing region
//       // password can be arbitrary for client-side protection demo
//       if (typeof editor.enforceProtection === "function") {
//         editor.enforceProtection("sec-protect", "ReadOnly");
//       }
//     } catch (e) {
//       // some Syncfusion builds may behave differently; continue to try insertEditingRegion
//     }

//     const start = section.startBlockIndex ?? section.start ?? 0;
//     const end = section.endBlockIndex ?? section.end ?? start;

//     // If any assignment allows editing, create an editing region; otherwise leave document protected
//     const assignments = getAssignments(section);
//     const anyCanEdit = assignments.some((a) => a.canEdit);
//     if (anyCanEdit) {
//       applyEditableRange(editor, start, end, "Everyone");
//       try {
//         // focus into editor
//         editor.focusIn();
//       } catch {}
//     }
//   }

//   const handleSave = async () => {
//     if (!selectedSection) return;

//     const editor = editorRef.current?.documentEditor;
//     if (!editor) return;

//     setIsSaving(true);

//     try {
//       const newJson = normalizeJson(editor.serialize());

//       setSections((current) =>
//         current.map((section) =>
//           section.id === selectedSection.id
//             ? { ...section, jsonContent: newJson }
//             : section,
//         ),
//       );
//       setSelectedSection((current) =>
//         current ? { ...current, jsonContent: newJson } : current,
//       );

//       toast.success("Lưu thành công");
//       setIsDirty(false);
//     } catch {
//       toast.error("Lưu thất bại");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-slate-50">
//         <span className="loading loading-spinner loading-lg text-blue-600"></span>
//       </div>
//     );
//   }

//   return (
//     <main className="min-h-screen bg-[#f1f3f4] text-slate-900">
//       <header className="border-b border-slate-200 bg-white shadow-sm">
//         <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-4 py-3 md:px-6">
//           <div className="flex items-center gap-3">
//             <button
//               type="button"
//               onClick={() => navigate(-1)}
//               className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
//               aria-label="Quay lại"
//             >
//               <ArrowLeft size={18} />
//             </button>

//             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a73e8] text-white">
//               <Lock size={18} />
//             </div>

//             <div>
//               <h1 className="text-lg font-semibold text-slate-900">
//                 Phân quyền section
//               </h1>
//               <p className="text-xs text-slate-500">
//                 Chỉnh sửa theo từng section
//               </p>
//             </div>
//           </div>

//           <div className="ml-auto text-right text-sm md:text-base">
//             <span className="text-slate-500">Văn bản:</span>{" "}
//             <span className="font-medium text-slate-900">{documentTitle}</span>
//           </div>
//         </div>
//       </header>

//       <div className="mx-auto flex h-[calc(100vh-73px)] w-full max-w-[1600px] gap-4 overflow-hidden p-4">
//         <div className="flex w-full max-w-[360px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
//           <div className="border-b border-slate-200 px-4 py-4">
//             <div className="flex items-center gap-2">
//               <Users size={18} className="text-[#1a73e8]" />
//               <h2 className="text-base font-semibold">Sections</h2>
//             </div>
//             <p className="mt-1 text-xs text-slate-500">
//               Chọn section để xem và chỉnh nội dung tương ứng.
//             </p>
//           </div>

//           <div className="flex-1 space-y-3 overflow-y-auto p-3">
//             {sections.length === 0 ? (
//               <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
//                 Chưa có section nào.
//               </div>
//             ) : null}

//             {sections.map((section) => {
//               const indentPx = Math.max(0, (section.level || 1) - 1) * 12;
//               const isSelected = selectedSection?.id === section.id;
//               const assignments = getAssignments(section);

//               return (
//                 <button
//                   key={section.id}
//                   type="button"
//                   onClick={() => handleSelectSection(section)}
//                   style={{ marginLeft: indentPx }}
//                   className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
//                     isSelected
//                       ? "border-blue-200 bg-blue-50 shadow-sm"
//                       : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
//                   }`}
//                 >
//                   <div className="flex items-start justify-between gap-3">
//                     <div className="min-w-0">
//                       <div className="truncate text-sm font-semibold text-slate-900">
//                         {section.title}
//                       </div>
//                       <div className="mt-1 text-xs text-slate-500">
//                         {assignments.length} người được gán
//                       </div>
//                     </div>

//                     <div className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
//                       Lv{section.level || 1}
//                     </div>
//                   </div>
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         <section className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-scroll ">
//           {errorMessage ? (
//             <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
//               {errorMessage}
//             </div>
//           ) : null}

//           <div className="rounded-3xl  border border-slate-200 bg-white p-4 shadow-sm">
//             <div className="flex flex-row gap-4 items-center lg:flex-row lg:items-start lg:justify-between">
//               <div className="min-w-0">
//                 <div className="flex flex-wrap items-center gap-2">
//                   <h2 className="text-lg font-semibold text-slate-900">
//                     {selectedSection?.title || "Chưa chọn section"}
//                   </h2>
//                 </div>
//               </div>

//               <div className="flex flex-wrap gap-2">
//                 <button
//                   type="button"
//                   onClick={() => setShowNavigationPane((current) => !current)}
//                   className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
//                 >
//                   {showNavigationPane ? "Ẩn heading" : "Hiện heading"}
//                 </button>

//                 <button
//                   type="button"
//                   onClick={handleSave}
//                   disabled={isSaving || !selectedSection}
//                   className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {isSaving ? "Đang lưu..." : "Lưu section"}
//                 </button>

//                 <button
//                   type="button"
//                   onClick={handleAddUser}
//                   className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   <Plus size={16} />
//                   Thêm Edit
//                 </button>
//               </div>
//             </div>
//             <div className="flex flex-wrap gap-2 ">
//               {selectedSection ? (
//                 getAssignments(selectedSection).map((assignment) => (
//                   <div
//                     key={assignment.id}
//                     className="rounded-2xl border border-slate-200 bg-slate-50 px-2"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="truncate text-sm font-medium text-slate-900">
//                         Ten 1
//                       </div>

//                       <button
//                         type="button"
//                         onClick={() => handleRemoveUser(assignment.id)}
//                         className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600"
//                         aria-label="Xóa quyền"
//                       >
//                         <TrashIcon size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
//                   Hãy chọn một section ở cột bên trái.
//                 </div>
//               )}
//             </div>
//           </div>
//           {/* nọi dung doc */}
//           <DocViewer
//             documentId={documentId}
//             showNavigationPane={showNavigationPane}
//           />
//         </section>
//       </div>
//     </main>
//   );
// };

// export default SectionAuthority;
