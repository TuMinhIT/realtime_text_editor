import React from "react";
import DocumentEditor from "../components/DocumentEditor";

const EditorPage = () => {
  // Get document ID from URL params or use default
  const documentId = "doc-001";

  return <DocumentEditor documentId={documentId} />;
};

export default EditorPage;
