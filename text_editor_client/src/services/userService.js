import { http } from "./http";

const userResource = "/users";

const toError = (err) => {
  const message =
    err?.response?.data?.message || err?.message || "Request failed";
  return new Error(message);
};

export const userService = {
  async login(email, password) {
    try {
      const res = await http.post(userResource + "/login", { email, password });
      const data = res.data;
      //console.log(data);
      if (data?.token) {
        http.setToken(data.token);
      }
      return data;
    } catch (err) {
      return null;
      throw toError(err);
    }
  },

  async register(name, email, password) {
    try {
      const res = await http.post(userResource + "/register", {
        name,
        email,
        password,
      });
      const data = res.data;

      if (data?.token) {
        http.setToken(data.token);
      }

      return data;
    } catch (err) {
      throw toError(err);
    }
  },

  async getAllUser() {
    try {
      const res = await http.get(userResource);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async blockUser({ userId }) {
    try {
      const res = await http.post(`${userResource}/${userId}/block`);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },

  async getProfile() {
    try {
      const res = await http.get(`${userResource}/me`);
      return res.data;
    } catch {
      return null;
    }
  },

  async updateUser({ userId, userInfo }) {
    try {
      const res = await http.patch(`${userResource}/${userId}`, userInfo);
      return res.data;
    } catch (err) {
      throw toError(err);
    }
  },
  async logout() {
  try {
    const res = await http.post(`${userResource}/logout`);
    return res.data;
  } catch (err) {
    throw toError(err);
  }
}
};
