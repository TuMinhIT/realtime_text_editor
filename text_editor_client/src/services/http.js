import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 50000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// LUÔN gắn token mỗi request
axiosInstance.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

//Thêm refresh token:
let isRefreshing = false;
let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (response) => {
    //console.log("[RESPONSE OK]", response.config.url, response.status);
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    //console.log("[RESPONSE ERROR]", originalRequest?.url);
    //console.log("[STATUS]", error.response?.status);

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/users/refresh-token"
    ) {
      originalRequest._retry = true;

      try {
        // Chỉ cho phép 1 request refresh chạy
        if (!isRefreshing) {
          isRefreshing = true;

          //console.log("[REFRESH] Starting refresh...");

          refreshPromise = axiosInstance
            .post("/users/refresh-token")
            .then((res) => {
              //console.log("[REFRESH RESPONSE]", res.data);

              const token = res.data.accessToken;

              localStorage.setItem("accessToken", token);

              return token;
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        // Các request khác sẽ đợi refresh xong
        const newAccessToken = await refreshPromise;

        //console.log("[NEW ACCESS TOKEN]", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        //console.log("[RETRY]", originalRequest.url);

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const http = {
  setToken(token) {
    if (token) {
      window.localStorage.setItem("accessToken", token);
    } else {
      window.localStorage.removeItem("accessToken");
    }
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
