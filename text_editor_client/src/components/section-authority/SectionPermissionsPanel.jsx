import React from "react";
import { Plus, Trash2 } from "lucide-react";

const SectionPermissionsPanel = ({
  selectedSection,
  assignments,
  newUserEmail,
  isAddingUser,
  onNewUserEmailChange,
  onAddUser,
  onRemoveUser,
  onTogglePermission,
}) => {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <h3 className="text-base font-semibold text-slate-900">Quyền section</h3>
        <p className="mt-1 text-xs text-slate-500">
          Danh sách người được gán vào section đang chọn.
        </p>
      </div>

      <div className="border-b border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            value={newUserEmail}
            onChange={(event) => onNewUserEmailChange(event.target.value)}
            placeholder="email@domain.com"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#1a73e8]"
          />
          <button
            type="button"
            onClick={onAddUser}
            disabled={isAddingUser}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            {isAddingUser ? "Đang thêm" : "Thêm"}
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {selectedSection ? (
          assignments.length > 0 ? (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {assignment.userName || assignment.userEmail}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {assignment.userEmail}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveUser(assignment.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-red-600"
                    aria-label="Xóa quyền"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => onTogglePermission(assignment.id, "canEdit")}
                    className={`rounded-full px-3 py-1 transition ${
                      assignment.canEdit
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    Edit: {assignment.canEdit ? "Bật" : "Tắt"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onTogglePermission(assignment.id, "canDelete")
                    }
                    className={`rounded-full px-3 py-1 transition ${
                      assignment.canDelete
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    Delete: {assignment.canDelete ? "Bật" : "Tắt"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Section này chưa có người được gán.
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Hãy chọn một section ở cột bên trái.
          </div>
        )}
      </div>
    </aside>
  );
};

export default SectionPermissionsPanel;
