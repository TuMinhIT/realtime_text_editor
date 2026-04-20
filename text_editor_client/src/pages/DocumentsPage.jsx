import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  Files,
  LayoutTemplate,
  PencilLine,
  Users,
} from "lucide-react";
import DocumentUpload from "../components/DocumentUpload";
import DashboardLayout from "../components/DashboardLayout";
import { APP_ROUTES } from "../constants/routes";
import { documentService } from "../services/documentService";

const featureCards = [
  {
    icon: LayoutTemplate,
    title: "Landing ro rang",
    description: "Mot trang bat dau de upload file va quan ly document gan day.",
  },
  {
    icon: PencilLine,
    title: "Editor tap trung",
    description: "Mot man hinh word-style de chinh sua, xem thong tin va mock save.",
  },
  {
    icon: Users,
    title: "De mo rong realtime",
    description: "Cau truc UI tach rieng de sau nay noi collaboration va permission.",
  },
];

const seedDocuments = [
  {
    id: "demo-proposal",
    title: "Product Proposal",
    description: "Bo cuc de xuat san pham theo style Word hien dai.",
    updatedAt: "2026-04-20T10:00:00.000Z",
    sections: 6,
  },
  {
    id: "demo-contract",
    title: "Internal Guideline",
    description: "Tai lieu noi bo voi heading, section va ghi chu ro rang.",
    updatedAt: "2026-04-19T15:30:00.000Z",
    sections: 8,
  },
];

const readDocuments = () => {
  const storedDocuments = documentService.getRecentDocuments();
  return storedDocuments.length ? storedDocuments : seedDocuments;
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState(readDocuments);
  const [isUploading, setIsUploading] = useState(false);

  const stats = useMemo(
    () => [
      { label: "Workspace", value: `${documents.length}+` },
      { label: "Mock template", value: "02" },
      { label: "Word style", value: "Ready" },
    ],
    [documents.length],
  );

  const openDocument = (documentId) => {
    navigate(`${APP_ROUTES.editor}?doc=${documentId}`);
  };

  const handleUpload = (file) => {
    setIsUploading(true);

    window.setTimeout(() => {
      const documentId = `mock-${Date.now()}`;
      const nextDocument = {
        id: documentId,
        title: file.name.replace(/\.docx$/i, ""),
        description: "Tai lieu moi tu upload mock, san sang mo trong editor.",
        updatedAt: new Date().toISOString(),
        sections: 5,
      };

      const nextDocuments = [
        nextDocument,
        ...documents.filter((item) => item.id !== documentId),
      ].slice(0, 8);

      setDocuments(nextDocuments);
      documentService.saveRecentDocument(nextDocument);
      setIsUploading(false);
      openDocument(documentId);
    }, 650);
  };

  return (
    <DashboardLayout
      title="Document workspace"
      subtitle="Trang nay giu vai tro upload file mock, mo document gan day va dieu huong sang man editor theo flow dashboard."
    >
      <div className="grid gap-6">
        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-[0_35px_120px_-55px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                Tailwind Word Workspace
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
                  Mot trang upload va mot trang editor, bo cuc gon va de code tiep.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                  Flow hien tai tap trung vao giao dien: vao workspace, upload file
                  Word mock, mo editor va chinh sua trong layout giong Word.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {featureCards.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                      <feature.icon size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{feature.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <DocumentUpload
            onUpload={handleUpload}
            isLoading={isUploading}
            title="Tao document moi"
            description="Keo tha hoac bam de chon file .docx. Sau khi upload, app se tao document mock va dieu huong sang trang editor."
          />

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Quick start</p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Mo nhanh mot workspace mau
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Files size={22} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {seedDocuments.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => openDocument(doc.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-400 hover:bg-white"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{doc.description}</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-500" />
                </button>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Recent documents</p>
              <h2 className="mt-1 text-3xl font-semibold text-slate-950">
                Danh sach document gan day
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Phan nay dang dung local storage de mock workspace, nen ban co the
              test giao dien ma khong can backend upload.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => (
              <article
                key={doc.id}
                className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <Files size={22} />
                  </div>
                  <button
                    type="button"
                    onClick={() => openDocument(doc.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                  >
                    Open
                    <ArrowRight size={15} />
                  </button>
                </div>

                <div className="mt-5 space-y-2">
                  <h3 className="text-xl font-semibold text-slate-950">{doc.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{doc.description}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="flex items-center gap-2 font-medium text-slate-700">
                      <Clock3 size={15} />
                      Updated
                    </p>
                    <p className="mt-2">{formatDate(doc.updatedAt)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="flex items-center gap-2 font-medium text-slate-700">
                      <PencilLine size={15} />
                      Sections
                    </p>
                    <p className="mt-2">{doc.sections}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default DocumentsPage;
