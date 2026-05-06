import React from "react";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";

const SERVICE_URL =
  "https://ej2services.syncfusion.com/production/web-services/api/documenteditor/";

const DocViewer = ({
  editorRef,
  selectedSection,
  previewSfdt,
  isPreviewLoading,
  showNavigationPane,
  handleCreated,
  handleContentChange,
}) => {
  return (
    <div className="grid min-h-0 flex-1 gap-4 ">
      <div className="min-h-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {selectedSection ? (
          isPreviewLoading && !previewSfdt ? (
            <div className="flex min-h-[420px] items-center justify-center px-6 text-center text-sm text-slate-500">
              Đang gọi backend để dựng preview section...
            </div>
          ) : previewSfdt ? (
            <DocumentEditorContainerComponent
              ref={editorRef}
              height="100%"
              enableToolbar
              created={handleCreated}
              contentChange={handleContentChange}
              documentEditorSettings={
                {
                  // showNavigationPane,
                }
              }
              serviceUrl={SERVICE_URL}
            >
              <Inject services={[Toolbar]} />
            </DocumentEditorContainerComponent>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center px-6 text-center text-sm text-slate-500">
              Không thể dựng preview cho section này.
            </div>
          )
        ) : (
          <div className="flex min-h-[420px] items-center justify-center px-6 text-center text-sm text-slate-500">
            Chọn một section để mở nội dung và chỉnh sửa.
          </div>
        )}
      </div>
    </div>
  );
};

export default DocViewer;
