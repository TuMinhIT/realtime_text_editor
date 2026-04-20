// services/api.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://localhost:8001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (email, password, fullName) =>
    api.post("/users/register", { email, password, fullName }),

  login: (email, password) => api.post("/users/login", { email, password }),

  getProfile: () => api.get("/users/me"),

  searchUsers: (query) => api.get("/users/search", { params: { query } }),
};

// Document endpoints
export const documentAPI = {
  uploadDocument: (file, documentName) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentName", documentName);
    return api.post("/sections/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getDocumentSections: (docId) => api.get(`/sections/${docId}/sections`),

  getSection: (sectionId) => api.get(`/sections/section/${sectionId}`),

  updateSection: (sectionId, content) =>
    api.post("/sections/section/update", { sectionId, content }),

  assignUser: (sectionId, userId, permission) =>
    api.post("/sections/assign-user", { sectionId, userId, permission }),

  getSectionUsers: (sectionId) =>
    api.get(`/sections/section/${sectionId}/users`),

  removeUserFromSection: (sectionId, userId) =>
    api.delete(`/sections/section/${sectionId}/user/${userId}`),
};

export default api;
