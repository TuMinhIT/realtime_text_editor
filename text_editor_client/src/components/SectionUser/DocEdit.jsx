import React from "react";
import {
  DocumentEditorContainerComponent,
  Inject,
  Toolbar,
} from "@syncfusion/ej2-react-documenteditor";

const SERVICE_URL = import.meta.env.VITE_API_URL + "/document";

const DocEdit = ({
  editorRef,
  showNavigationPane,
  handleCreated,
  handleContentChange,
  canEdit,
}) => {
  return (
    <>
      <section className="flex min-w-0 flex-1 flex-col gap-1 mb-10">
        <div className=" overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-auto">
            <DocumentEditorContainerComponent
              ref={editorRef}
              height="100%"
              enableToolbar={true}
              created={handleCreated}
              showPropertiesPane={true}
              contentChange={handleContentChange}
              documentEditorSettings={{
                showNavigationPane: !!showNavigationPane,
                isReadOnly: !canEdit,
              }}
              serviceUrl={SERVICE_URL}
            >
              <Inject services={[Toolbar]} />
            </DocumentEditorContainerComponent>
          </div>
        </div>
      </section>
    </>
  );
};

export default DocEdit;
