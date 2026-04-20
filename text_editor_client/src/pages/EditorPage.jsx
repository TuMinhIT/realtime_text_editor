import React from "react";
import { useSearchParams } from "react-router-dom";
import DocumentEditor from "../components/DocumentEditor";

const EditorPage = () => {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get("doc") || "mock-doc-001";

  return <DocumentEditor documentId={documentId} />;
};

export default EditorPage;
