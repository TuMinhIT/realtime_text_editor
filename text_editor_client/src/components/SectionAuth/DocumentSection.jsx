import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock3,
  DeleteIcon,
  FileText,
  FolderOpen,
  MoveDiagonal2,
  Plus,
  SaveAllIcon,
  Search,
  Upload,
  UserCheck,
} from "lucide-react";

import { http } from "../services/http";
import { sessionService } from "../services/sessionService";
import { documentService } from "../services/documentService";
import { mapUploadResponseToRecentDocument } from "../utils/documentMappers";
import { CgAdd, CgSpinner } from "react-icons/cg";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import { SiAuthelia } from "react-icons/si";

//import realtime:
import { signalRService } from "../services/signalRService";
import ProofFileSection from "../components/SectionAuth/ProofFileSection";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const mapDocumentListItem = (doc, fallbackOwner) => ({
  id: doc.documentId || doc.id,
  title: doc.title || doc.documentTitle || "Untitled document",
  description: doc.description || doc.originalFileName || "Tai lieu da tai len",
  updatedAt:
    doc.updatedAt ||
    doc.lastModifiedAt ||
    doc.createdAt ||
    new Date().toISOString(),
  sections:
    doc.sectionsCount ||
    doc.sectionCount ||
    doc.sections?.length ||
    doc.blocks?.length ||
    "-",
  owner: doc.ownerName || doc.owner || fallbackOwner,
  lastEditor: doc.lastEditorName || doc.lastEditor || fallbackOwner,
});

const DocumentSection = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const currentUser = sessionService.getCurrentUser();
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadDocuments = async () => {
    setIsLoadingDocuments(true);
    setErrorMessage("");

    try {
      const items = await documentService.getAllDocuments();
      setDocuments(
        items
          .map((doc) =>
            mapDocumentListItem(doc, currentUser?.name || "Workspace"),
          )
          .filter((doc) => doc.id),
      );
    } catch (error) {
      setErrorMessage(error?.message || "Khong tai duoc danh sach tai lieu.");
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // mới dô load data lên đi
  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    if (!keyword.trim()) {
      return documents;
    }

    const normalizedKeyword = keyword.toLowerCase();
    return documents.filter((doc) => {
      return (
        doc.title.toLowerCase().includes(normalizedKeyword) ||
        doc.description.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [documents, keyword]);

  const handleUpload = async (file) => {
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    if (!isDocx) {
      window.alert("Vui long chon file .docx");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      const response = await documentService.uploadDocument(file);
      if (response) {
        const documentId = response?.documentId || response?.id;
        if (documentId) {
          setTimeout(() => {
            navigate(`document/${documentId}`);
          }, 500);
        } else {
          loadDocuments();
        }
      }
    } catch (error) {
      setErrorMessage(
        error?.message || "Upload that bai. Hay kiem tra token va API.",
      );
      toast.error("Upload that bai");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    handleUpload(file);
    event.target.value = "";
  };

  const handleCreateBlank = () => {
    window.alert(
      "Backend hien tai moi co upload/getAll/content. Neu muon tao file trang, ban can them endpoint tao document rong tra ve SFDT mac dinh.",
    );
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Bạn có chắc muốn xóa tài liệu này?");

    if (!isConfirmed) return;

    try {
      const response = await documentService.deleteDocument(id);

      if (response) {
        toast.success("Đã xóa!");
        loadDocuments();
      }
    } catch (error) {
      setErrorMessage(
        error?.message || "Xóa thất bại. Hãy kiểm tra token và API.",
      );
    }
  };

  const openDocument = (documentId) => {
    navigate(`document/${documentId}`);
  };

  const openSectionAuthority = (documentId, title) => {
    navigate(`sections/${documentId}`, {
      state: {
        documentTitle: title,
      },
    });
  };

  const handleLogout = () => {
    //Kết thúc signalR khi đăng xuất:
    signalRService.disconnect();

    sessionService.clearStore();
    http.setToken(null);
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#f1f3f4] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a73e8] text-white">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-lg font-medium text-slate-900">Docs</h1>
              <p className="text-xs text-slate-500">Realtime Editor</p>
            </div>
          </div>

          <label className="ml-auto flex w-full max-w-xl items-center gap-3 rounded-full bg-[#f1f3f4] px-4 py-2.5">
            <Search size={18} className="text-slate-500" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tim tai lieu"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>

          <div className="hidden px-3 py-2 text-sm font-medium text-black md:block">
            {currentUser?.fullName}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden rounded-full bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 hover:text-white md:block"
          >
            logout
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6">
        <section className="mt-4 rounded-2xl bg-white p-3 md:p-6">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center flex-row gap-2.5">
              <span className="flex text-lg font-medium text-slate-900">
                Recent documents
              </span>

              <span className=" flex text-sm text-slate-500">
                {filteredDocuments.length} tai lieu
              </span>
            </div>
            <div className="flex ">
              {isUploading ? (
                <ClipLoader color="red" />
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl  bg-white transition hover:border-[#1a73e8] hover:shadow-sm"
                  disabled={isUploading}
                >
                  <div className="flex p-2  items-center justify-center rounded-xl bg-[#e8f0fe] text-[#1a73e8]">
                    <CgAdd size={25} />
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    Name
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    Owner
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    Last modified
                  </th>

                  <th className="border-b border-slate-200 px-4 py-3 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingDocuments ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="border-b border-slate-100 px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Dang tai danh sach tai lieu...
                    </td>
                  </tr>
                ) : filteredDocuments.length ? (
                  filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="text-sm text-slate-700 hover:bg-[#f8fafc]"
                    >
                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8]">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {doc.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {doc.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        {doc.owner || "Workspace"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 size={14} />
                          {formatDate(doc.updatedAt)}
                        </span>
                      </td>

                      <td className="border-b border-slate-100 px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openDocument(doc.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:border-[#1a73e8] hover:text-[#1a73e8]"
                        >
                          <FolderOpen size={15} />
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-red-400"
                        >
                          <DeleteIcon size={15} />
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openSectionAuthority(doc.id, doc.title)
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-red-400"
                        >
                          <UserCheck size={15} />
                          Authority
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="border-b border-slate-100 px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Chua co tai lieu nao. Hay upload file `.docx` dau tien.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <ProofFileSection />
      </div>
    </main>
  );
};

export default DocumentSection;
