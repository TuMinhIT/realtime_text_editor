import { apiClient } from "./apiClient";

export const sectionService = {
  async getSections(documentId) {
    return apiClient.get(`/sections/${documentId}/sections`);
  },

  async getSection(sectionId) {
    return apiClient.get(`/sections/section/${sectionId}`);
  },

  async updateSectionContent(sectionId, content) {
    return apiClient.post("/sections/section/update", {
      sectionId,
      content,
    });
  },

  async assignUser(sectionId, userId, permission) {
    return apiClient.post("/sections/assign-user", {
      sectionId,
      userId,
      permission,
    });
  },

  async getSectionUsers(sectionId) {
    return apiClient.get(`/sections/section/${sectionId}/users`);
  },

  async removeUser(sectionId, userId) {
    return apiClient.delete(`/sections/section/${sectionId}/user/${userId}`);
  },
};
