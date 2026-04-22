import { http } from "./http";

const resource = "/auth";

const toError = (err) => err?.response?.data || err;

export const authService = {
  async loginUser({ email, password }) {
    try {
      const res = await http.post(resource + "/login", {
        email,
        password,
      });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async googleLogin({ credential }) {
    try {
      const res = await http.post(resource + "/google", { credential });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async loginAdmin({ email, password }) {
    try {
      const res = await http.post(resource + "/login-admin", {
        email,
        password,
      });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async refreshToken(refreshToken) {
    try {
      const res = await http.post(resource + "/refresh-token", {
        refreshToken,
      });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async logout(refreshToken) {
    try {
      const res = await http.post(resource + "/logout", {
        refreshToken,
      });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async verifyOTP({ email, otp, type = "password_reset" }) {
    try {
      const res = await http.post("/email/verify-otp", {
        email,
        otp,
        type,
      });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async changePassword({ userId, oldPassword, newPassword }) {
    try {
      const res = await http.post(resource + "/change-password", {
        userId,
        oldPassword,
        newPassword,
      });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async resetPassword({ email, newPassword }) {
    try {
      const res = await http.post(resource + "/reset-password", {
        email,
        newPassword,
      });
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },
};
