/**
 * Document API Service
 * Handles all document-related API calls to the .NET backend
 */

import { apiClient } from "./apiClient";

export const documentService = {
  /**
   * Get all documents for current user
   */
  async getDocuments(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/documents${queryString ? "?" + queryString : ""}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  },

  /**
   * Get single document by ID
   */
  async getDocument(documentId) {
    try {
      return await apiClient.get(`/documents/${documentId}`);
    } catch (error) {
      console.error("Error fetching document:", error);
      throw error;
    }
  },

  /**
   * Create new document
   */
  async createDocument(data) {
    try {
      return await apiClient.post("/documents", data);
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  },

  /**
   * Update document (title, metadata)
   */
  async updateDocument(documentId, data) {
    try {
      return await apiClient.put(`/documents/${documentId}`, data);
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  },

  /**
   * Delete document
   */
  async deleteDocument(documentId) {
    try {
      return await apiClient.delete(`/documents/${documentId}`);
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  },

  /**
   * Upload document file and parse into sections
   */
  async uploadDocument(file, documentTitle = "") {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", documentTitle || file.name);

      const response = await fetch(`${apiClient.baseURL}/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: apiClient.headers.Authorization || "",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  },

  /**
   * Download document as .docx
   */
  async downloadDocument(documentId) {
    try {
      const response = await fetch(
        `${apiClient.baseURL}/documents/${documentId}/download`,
        {
          method: "GET",
          headers: apiClient.headers,
        },
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Get filename from header if available
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `document-${documentId}.docx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      throw error;
    }
  },

  /**
   * Share document with users
   */
  async shareDocument(documentId, userEmails, permissions = "view") {
    try {
      return await apiClient.post(`/documents/${documentId}/share`, {
        userEmails,
        permissions,
      });
    } catch (error) {
      console.error("Error sharing document:", error);
      throw error;
    }
  },

  /**
   * Get document access list
   */
  async getDocumentAccess(documentId) {
    try {
      return await apiClient.get(`/documents/${documentId}/access`);
    } catch (error) {
      console.error("Error fetching document access:", error);
      throw error;
    }
  },

  /**
   * Get active users in document
   */
  async getActiveUsers(documentId) {
    try {
      return await apiClient.get(`/documents/${documentId}/users/active`);
    } catch (error) {
      console.error("Error fetching active users:", error);
      throw error;
    }
  },
};
