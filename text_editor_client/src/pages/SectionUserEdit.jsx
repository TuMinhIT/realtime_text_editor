import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookA,
  Menu,
  X,
  Users,
  ArrowRight,
  ArrowBigDown,
} from "lucide-react";
import { toast } from "react-toastify";

import sectionService from "../services/sectionService";
import { sessionService } from "../services/sessionService";
// Thêm realtime service:
import { signalRService } from "../services/signalRService";

import ProofFileTab from "../components/SectionUser/ProofFileTab";
import SectionEdit from "./SectionEdit";

const SectionUserEdit = () => {
  const location = useLocation();
  const { documentId, title } = useParams();
  const navigate = useNavigate();

  const [sections, setSections] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [selectedSection, setSelectedSection] = useState(null);

  const [openAside, setOpenAside] = useState(true);
  const [tab, setTab] = useState("section");

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

  // load section all section
  useEffect(() => {
    if (!documentId) {
      toast.error("Không tìm thấy documentId trên route.");

      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadSections();
      } catch (error) {
        toast.error("Không tải được dữ liệu section từ backend.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [documentId]);

  // phân cấp độ
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

  const handleSelectSection = async (section) => {
    try {
      if (selectedSection?.id === section.id) {
        return;
      }

      if (selectedSection?.id) {
        signalRService.releaseEditSession(selectedSection.id);
        signalRService.leaveCurrentSection();
      }

      setSelectedSection(section);
    } catch (err) {
      console.error(err);
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
              onClick={() => navigate("/")}
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
              <span className="font-medium text-slate-900">{title}</span>
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

        {/* Nọi dung */}
        {selectedSection && (
          <SectionEdit documentId={documentId} tempSection={selectedSection} />
        )}
      </div>
    </main>
  );
};

export default SectionUserEdit;
