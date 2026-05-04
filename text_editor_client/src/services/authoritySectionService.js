import { http } from "./http";

const resource = "/sections";

export const AuthoritySectionService = {
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
      const res = await http.get(`${resource}/${documentId}/content`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async updateDocumentContent(documentId, jsonContent) {
    try {
      const res = await http.put(`${resource}/${documentId}/content`, {
        jsonContent,
      });
      return res.data;
      return true;
    } catch (err) {
      throw toError(err);
    }
  },

  async updateDocumentTitle(documentId, title) {
    try {
      const res = await http.post(
        `${resource}/${documentId}/title?title=${title}`,
      );
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async deleteDocument(id) {
    try {
      const res = await http.post(`${resource}/remove/${id}`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },
};

export default AuthoritySectionService;
