import { SectionIcon } from "lucide-react";
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

  async updateSectionContent(sectionId, jsonContent) {
    try {
      const res = await http.put(`${resource}/${sectionId}`, {
        Content: jsonContent,
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
  // thêm 1 user vào secsion permission
  async addUserToSetion(sectionId, userId, permission = 1) {
    try {
      const res = await http.post(`${resource}/assign-user`, {
        sectionId,
        userId,
        permission: permission,
      });

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
  // /get assignment của 1 sections
  async getSectionAssignments(sectionId) {
    try {
      const res = await http.get(`${resource}/assignments/${sectionId}`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  // user/ { user Id: guid } / section / { sectionId: guid }"
  // get quyền của 1 user trên 1 section
  async getUserAssignments({ userId, sectionId }) {
    try {
      const res = await http.get(
        `${resource}/user/${userId}/section/${sectionId}`,
      );
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  // xóa phân quyền section
  // permission/{sectionPermissionId:guid}"
  async removeUserFromSection(id) {
    try {
      const res = await http.delete(`${resource}/permission/${id}`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  //get nội dung section được chọn
  async previewSection(sectionId, sectionContent, documentId) {
    try {
      const res = await http.post(`${resource}/preview-section`, {
        documentId: documentId,
        sectionContent: sectionContent,
        sectionId: sectionId,
      });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },
};

export default sectionService;
