import React from "react";
import { useSearchParams } from "react-router-dom";
import DocumentEditor from "../components/DocumentEditor";

const DEFAULT_DOCUMENT_ID = "mock-doc-001";

const EditorPage = () => {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get("doc") || DEFAULT_DOCUMENT_ID;

  return <DocumentEditor documentId={documentId} />;
};

export default EditorPage;
