import React, { useRef, useState } from "react";
import { FileText, FolderUp, Sparkles } from "lucide-react";

const baseClasses =
  "group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_30px_90px_-44px_rgba(15,23,42,0.5)]";

const DocumentUpload = ({
  onUpload,
  isLoading = false,
  title = "Upload file .docx",
  description = "Chon file Word de tao workspace chinh sua. Hien tai dang dung mock flow nen khong can backend.",
  compact = false,
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) {
      return;
    }

    const isDocx = file.name.toLowerCase().endsWith(".docx");
    if (!isDocx) {
      window.alert("Vui long chon file .docx");
      return;
    }

    onUpload?.(file);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <section className={baseClasses}>
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-amber-100 via-transparent to-cyan-100 opacity-80" />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex cursor-pointer flex-col rounded-[24px] border border-dashed px-5 py-6 text-left transition ${
          isDragging
            ? "border-slate-900 bg-slate-50"
            : "border-slate-300 bg-slate-50/70 hover:border-slate-500 hover:bg-slate-50"
        } ${compact ? "gap-4" : "gap-5"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          className="hidden"
          disabled={isLoading}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
            <FolderUp size={26} />
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <Sparkles size={14} />
            Mock upload
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Dang tao workspace...
              </>
            ) : (
              <>
                <FileText size={16} />
                Chon file Word
              </>
            )}
          </button>

          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Ho tro .docx
          </p>
        </div>
      </div>
    </section>
  );
};

export default DocumentUpload;
