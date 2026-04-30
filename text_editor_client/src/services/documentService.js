import { http } from "./http";

const resource = "/document";

const toError = (err) => err?.response?.data || err;

const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.documents)) {
    return payload.documents;
  }

  return [];
};

export const documentService = {
  async uploadDocument(file, title) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      if (title?.trim()) {
        formData.append("title", title.trim());
      }

      const res = await http.post(`${resource}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async getAllDocuments() {
    try {
      const res = await http.get(`${resource}/getAll`);
      return normalizeListResponse(res.data);
    } catch (err) {
      throw toError(err);
    }
  },

  async getDocumentBlocks(documentId) {
    try {
      const res = await http.get(`${resource}/${documentId}/blocks`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async getDocumentContent(documentId) {
    try {
      const res = await http.get(`${resource}/${documentId}/content`, {
        responseType: "text",
      });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },
};

export default documentService;
