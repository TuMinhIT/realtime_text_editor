import React from "react";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";

const SERVICE_URL =
  "https://ej2services.syncfusion.com/production/web-services/api/documenteditor/";

const SectionPreviewPanel = ({
  selectedSection,
  errorMessage,
  isDirty,
  isPreviewLoading,
  sectionHeading,
  sectionBody,
  showNavigationPane,
  onToggleNavigationPane,
  onSave,
  editorRef,
  onCreated,
  onContentChange,
  previewSfdt,
}) => {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedSection?.title || "Chưa chọn section"}
              </h2>
              {isDirty ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                  Preview đã sửa
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Preview đồng bộ
                </span>
              )}
              {isPreviewLoading ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Đang dựng preview...
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {sectionHeading || "Tiêu đề section"}
            </p>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {sectionBody ||
                "Nội dung section sẽ hiển thị trong khung editor bên dưới."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onToggleNavigationPane}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              {showNavigationPane ? "Ẩn heading" : "Hiện heading"}
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={!selectedSection}
              className="rounded-full bg-[#1a73e8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Lưu section
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {selectedSection ? (
          isPreviewLoading && !previewSfdt ? (
            <div className="flex h-full min-h-[520px] items-center justify-center px-6 text-center text-sm text-slate-500">
              Đang gọi backend để dựng preview section...
            </div>
          ) : previewSfdt ? (
            <DocumentEditorContainerComponent
              ref={editorRef}
              height="100%"
              enableToolbar
              created={onCreated}
              contentChange={onContentChange}
              documentEditorSettings={{
                showNavigationPane,
              }}
              serviceUrl={SERVICE_URL}
            >
              <Inject services={[Toolbar]} />
            </DocumentEditorContainerComponent>
          ) : (
            <div className="flex h-full min-h-[520px] items-center justify-center px-6 text-center text-sm text-slate-500">
              Không thể dựng preview cho section này.
            </div>
          )
        ) : (
          <div className="flex h-full min-h-[520px] items-center justify-center px-6 text-center text-sm text-slate-500">
            Chọn một section để mở nội dung và chỉnh sửa.
          </div>
        )}
      </div>
    </section>
  );
};

export default SectionPreviewPanel;
