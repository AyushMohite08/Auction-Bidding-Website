// src/api/apiClient.js
import axios from "axios";

/**
 * ✅ Base URL logic:
 * Now exported directly for use in other parts of the app, like WebSockets.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * ✅ Axios instance:
 * The default export is still the configured client for making API calls.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ✅ Request Interceptor:
 * Automatically attaches the auth token to every request.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If the body is FormData (for file uploads), the browser sets the Content-Type.
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;