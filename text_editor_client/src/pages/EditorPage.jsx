import React from "react";
import { useParams } from "react-router-dom";
import DocumentEditor from "../components/DocumentEditor";

const DEFAULT_DOCUMENT_ID = "mock-doc-001";

const EditorPage = () => {
  const { documentId } = useParams();
  const activeDocumentId = documentId || DEFAULT_DOCUMENT_ID;

  return <DocumentEditor documentId={activeDocumentId} />;
};

export default EditorPage;
