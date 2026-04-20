import { STORAGE_KEYS } from "../constants/storageKeys";

const sanitizeUser = (user = {}) => ({
  id: user.id || user.userId || user.email || "",
  name: user.name || user.fullName || "",
  email: user.email || "",
});

export const sessionService = {
  getAuthToken() {
    return window.localStorage.getItem(STORAGE_KEYS.authToken);
  },

  getCurrentUser() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.currentUser);
      return raw ? sanitizeUser(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    const nextUser = sanitizeUser(user);
    window.localStorage.setItem(
      STORAGE_KEYS.currentUser,
      JSON.stringify(nextUser),
    );
    return nextUser;
  },

  clearCurrentUser() {
    window.localStorage.removeItem(STORAGE_KEYS.currentUser);
  },

  isAuthenticated() {
    const token = this.getAuthToken();
    const user = this.getCurrentUser();
    return Boolean(token && user?.id);
  },
};
