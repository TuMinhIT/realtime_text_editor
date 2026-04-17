/**
 * User & Authentication API Service
 * Handles user-related API calls to the .NET backend
 */

import { apiClient } from "./apiClient";

export const userService = {
  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });

      // Save token
      if (response.token) {
        apiClient.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  },

  /**
   * Register new user
   */
  async register(name, email, password) {
    try {
      const response = await apiClient.post("/auth/register", {
        name,
        email,
        password,
      });

      // Save token
      if (response.token) {
        apiClient.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error("Error registering:", error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await apiClient.post("/auth/logout", {});
      apiClient.setToken(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      return await apiClient.get("/users/me");
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(data) {
    try {
      return await apiClient.put("/users/me", data);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      return await apiClient.post("/users/change-password", {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  },

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken) {
    try {
      const response = await apiClient.post("/auth/refresh", {
        refreshToken,
      });

      if (response.token) {
        apiClient.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  },

  /**
   * Search users by email
   */
  async searchUsers(query) {
    try {
      return await apiClient.get(
        `/users/search?q=${encodeURIComponent(query)}`,
      );
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  async getUser(userId) {
    try {
      return await apiClient.get(`/users/${userId}`);
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  /**
   * Get user's shared documents
   */
  async getSharedDocuments() {
    try {
      return await apiClient.get("/users/me/documents/shared");
    } catch (error) {
      console.error("Error fetching shared documents:", error);
      throw error;
    }
  },

  /**
   * Get user's edit activity/history
   */
  async getUserActivity(limit = 50) {
    try {
      return await apiClient.get(`/users/me/activity?limit=${limit}`);
    } catch (error) {
      console.error("Error fetching user activity:", error);
      throw error;
    }
  },
};
