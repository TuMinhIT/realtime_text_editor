import React from "react";
import { Users } from "lucide-react";

const SectionListSidebar = ({
  sections,
  selectedSectionId,
  onSelectSection,
  getAssignmentCount,
}) => {
  return (
    <aside className="flex w-full max-w-[360px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[#1a73e8]" />
          <h2 className="text-base font-semibold">Sections</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Chọn section để gọi backend dựng preview SFDT tương ứng.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {sections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Chưa có section nào.
          </div>
        ) : null}

        {sections.map((section) => {
          const indentPx = Math.max(0, (section.level || 1) - 1) * 12;
          const isSelected = selectedSectionId === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section)}
              style={{ marginLeft: indentPx }}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
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
                  <div className="mt-1 text-xs text-slate-500">
                    {getAssignmentCount(section)} người được gán
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
  );
};

export default SectionListSidebar;
