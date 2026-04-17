/**
 * Section API Service
 * Handles all section-related API calls to the .NET backend
 */

import { apiClient } from "./apiClient";

export const sectionService = {
  /**
   * Get all sections in a document
   */
  async getSections(documentId) {
    try {
      return await apiClient.get(`/documents/${documentId}/sections`);
    } catch (error) {
      console.error("Error fetching sections:", error);
      throw error;
    }
  },

  /**
   * Get single section
   */
  async getSection(documentId, sectionId) {
    try {
      return await apiClient.get(
        `/documents/${documentId}/sections/${sectionId}`,
      );
    } catch (error) {
      console.error("Error fetching section:", error);
      throw error;
    }
  },

  /**
   * Create new section
   */
  async createSection(documentId, data) {
    try {
      return await apiClient.post(`/documents/${documentId}/sections`, data);
    } catch (error) {
      console.error("Error creating section:", error);
      throw error;
    }
  },

  /**
   * Update section content
   */
  async updateSectionContent(documentId, sectionId, content) {
    try {
      return await apiClient.put(
        `/documents/${documentId}/sections/${sectionId}/content`,
        { content },
      );
    } catch (error) {
      console.error("Error updating section content:", error);
      throw error;
    }
  },

  /**
   * Update section metadata (title, etc.)
   */
  async updateSection(documentId, sectionId, data) {
    try {
      return await apiClient.put(
        `/documents/${documentId}/sections/${sectionId}`,
        data,
      );
    } catch (error) {
      console.error("Error updating section:", error);
      throw error;
    }
  },

  /**
   * Delete section
   */
  async deleteSection(documentId, sectionId) {
    try {
      return await apiClient.delete(
        `/documents/${documentId}/sections/${sectionId}`,
      );
    } catch (error) {
      console.error("Error deleting section:", error);
      throw error;
    }
  },

  /**
   * Assign user to section
   */
  async assignUser(documentId, sectionId, userEmail) {
    try {
      return await apiClient.post(
        `/documents/${documentId}/sections/${sectionId}/assign`,
        { userEmail },
      );
    } catch (error) {
      console.error("Error assigning user to section:", error);
      throw error;
    }
  },

  /**
   * Remove user from section
   */
  async removeUser(documentId, sectionId, userId) {
    try {
      return await apiClient.delete(
        `/documents/${documentId}/sections/${sectionId}/users/${userId}`,
      );
    } catch (error) {
      console.error("Error removing user from section:", error);
      throw error;
    }
  },

  /**
   * Get section edit history
   */
  async getSectionHistory(documentId, sectionId, limit = 20) {
    try {
      return await apiClient.get(
        `/documents/${documentId}/sections/${sectionId}/history?limit=${limit}`,
      );
    } catch (error) {
      console.error("Error fetching section history:", error);
      throw error;
    }
  },

  /**
   * Get active editors in section
   */
  async getActiveEditors(documentId, sectionId) {
    try {
      return await apiClient.get(
        `/documents/${documentId}/sections/${sectionId}/editors`,
      );
    } catch (error) {
      console.error("Error fetching active editors:", error);
      throw error;
    }
  },

  /**
   * Lock section for editing (prevent concurrent edits)
   */
  async lockSection(documentId, sectionId) {
    try {
      return await apiClient.post(
        `/documents/${documentId}/sections/${sectionId}/lock`,
        {},
      );
    } catch (error) {
      console.error("Error locking section:", error);
      throw error;
    }
  },

  /**
   * Unlock section
   */
  async unlockSection(documentId, sectionId) {
    try {
      return await apiClient.post(
        `/documents/${documentId}/sections/${sectionId}/unlock`,
        {},
      );
    } catch (error) {
      console.error("Error unlocking section:", error);
      throw error;
    }
  },
};
