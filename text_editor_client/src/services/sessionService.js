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

  // Kiểm tra role của user
  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || "user"; // mặc định là "user"
  },

  // Kiểm tra xem user có phải admin không
  isAdmin() {
    return this.getUserRole() === "Admin";
  },

  // Kiểm tra xem user có phải user bình thường không
  isUser() {
    return this.getUserRole() === "user";
  },

  // Kiểm tra xem user có role nào đó không
  hasRole(role) {
    return this.getUserRole() === role;
  },
};
