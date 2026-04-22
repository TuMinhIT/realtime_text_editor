import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://localhost:8001/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const initialToken = window.localStorage.getItem("accessToken");
if (initialToken) {
  axiosInstance.defaults.headers.common.Authorization = `Bearer ${initialToken}`;
}

export const http = {
  setToken(token) {
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      window.localStorage.setItem("accessToken", token);
      return;
    }

    delete axiosInstance.defaults.headers.common.Authorization;
    window.localStorage.removeItem("accessToken");
  },

  get(url, config = {}) {
    return axiosInstance.get(url, config);
  },

  post(url, data = {}, config = {}) {
    return axiosInstance.post(url, data, config);
  },

  put(url, data = {}, config = {}) {
    return axiosInstance.put(url, data, config);
  },

  patch(url, data = {}, config = {}) {
    return axiosInstance.patch(url, data, config);
  },

  delete(url, config = {}) {
    return axiosInstance.delete(url, config);
  },
};

export default http;
