import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    //Nếu lỗi 401 và chưa retry:
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Gọi API refresh token ở đây
      try {
        const res = await axios.post(
          "https://localhost:8001/api/auth/refresh-token",
          {},
          { withCredentials: true },
        );
        const newAccessToken = res.data.accessToken;
        //Lưu token mới và retry request cũ:
        localStorage.setItem("accessToken", newAccessToken);
        //gắn lại header cho request cũ:
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        //Gọi lại request ban đầu:
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        //Nếu refresh token cũng lỗi (ví dụ hết hạn), xóa token và redirect login:
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401) {
//       //Tránh loop redirect:
//       const isLoginRequest = error.config.url.includes("/auth/login");
//       if (!isLoginRequest) {
//         window.localStorage.removeItem("accessToken");
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }

// );

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
