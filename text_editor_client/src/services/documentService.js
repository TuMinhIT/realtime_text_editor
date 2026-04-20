import { apiClient } from "./apiClient";

const RECENT_DOCUMENTS_KEY = "text-editor.recent-documents";

const readRecentDocuments = () => {
  try {
    const raw = localStorage.getItem(RECENT_DOCUMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeRecentDocuments = (documents) => {
  localStorage.setItem(RECENT_DOCUMENTS_KEY, JSON.stringify(documents));
};

export const documentService = {
  async uploadDocument(file, documentName = "") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentName", documentName || file.name);

    const response = await fetch(`${apiClient.baseURL}/sections/upload`, {
      method: "POST",
      headers: apiClient.headers.Authorization
        ? { Authorization: apiClient.headers.Authorization }
        : {},
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Upload document failed.");
    }

    return response.json();
  },

  getRecentDocuments() {
    return readRecentDocuments();
  },

  saveRecentDocument(document) {
    const current = readRecentDocuments();
    const next = [
      document,
      ...current.filter((item) => item.id !== document.id),
    ].slice(0, 20);
    writeRecentDocuments(next);
    return next;
  },

  removeRecentDocument(documentId) {
    const next = readRecentDocuments().filter((item) => item.id !== documentId);
    writeRecentDocuments(next);
    return next;
  },
};
