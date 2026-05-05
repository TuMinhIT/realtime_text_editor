import React from "react";
import { ArrowLeft, Lock } from "lucide-react";

const SectionAuthorityHeader = ({ documentTitle, onBack }) => {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a73e8] text-white">
            <Lock size={18} />
          </div>

          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Phân quyền section
            </h1>
            <p className="text-xs text-slate-500">Chỉnh sửa theo từng section</p>
          </div>
        </div>

        <div className="ml-auto text-right text-sm md:text-base">
          <span className="text-slate-500">Văn bản:</span>{" "}
          <span className="font-medium text-slate-900">{documentTitle}</span>
        </div>
      </div>
    </header>
  );
};

export default SectionAuthorityHeader;
