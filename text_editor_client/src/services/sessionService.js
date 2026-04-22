export const sessionService = {
  getAuthToken() {
    return window.localStorage.getItem("accessToken");
  },

  getCurrentUser() {
    try {
      const raw = window.localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    window.localStorage.setItem("user", JSON.stringify(user));
    return user;
  },
  setLogin(user, accessToken) {
    window.localStorage.setItem("accessToken", accessToken);
    window.localStorage.setItem("user", JSON.stringify(user));
    return user;
  },

  clearStore() {
    window.localStorage.removeItem("user");
    window.localStorage.removeItem("accessToken");
  },

  isAuthenticated() {
    const token = this.getAuthToken();
    const user = this.getCurrentUser();
    return Boolean(token && user?.id);
  },
};
