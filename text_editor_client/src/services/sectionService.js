import { http } from "./http";

const resource = "/section";
const toError = (err) => err?.response?.data || err;

export const sectionService = {

  //Lấy tất cả section của document
  async getAllSectionsByDocument(documentId) {
    try {
      const res = await http.get(`${resource}/document/${documentId}`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  //Lấy chi tiết section
  async getDocumentBlocks(documentId) {
    try {
      const res = await http.get(`${resource}/${documentId}/blocks`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  //Hiển thị tên tài liệu + contentDocumentContent
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

  async getSectionUsers(sectionId) {
    try {
      const res = await http.get(`${resource}/${sectionId}/users`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async previewSection(documentId, sectionContent) {
    try {
      const res = await http.post(`${resource}/preview-section`, {
        documentId,
        sectionContent,
      });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },
};

export default sectionService;
