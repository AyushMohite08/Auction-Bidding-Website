import axios from "axios";
import { markServiceRestored, markServiceUnavailable } from "../utils/serviceStatus";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
export const API_SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    markServiceRestored();
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.startsWith("/auth/");

    if (error.response?.status === 503) {
      markServiceUnavailable(error.response?.data?.message);
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest?._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    await apiClient.post("/auth/refresh");
    return apiClient(originalRequest);
  }
);

export default apiClient;
