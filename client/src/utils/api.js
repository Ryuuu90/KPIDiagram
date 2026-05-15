import axios from "axios";
import keycloak from "../keycloak";
import toast from 'react-hot-toast';

/**
 * Axios instance pre-configured to talk to the Express backend.
 * Automatically attaches the Keycloak Bearer token on every request.
 *
 * Usage:
 *   import api from '../utils/api';
 *   const { data } = await api.post('/calculation', payload);
 */
const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor — attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (keycloak.token) {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — silent refresh and GLOBAL error popups ────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle 401 (Expired) - Auto Refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await keycloak.updateToken(30);
        originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
        return api(originalRequest);
      } catch {
        toast.error("Session expired — please re-login.");
        keycloak.logout();
      }
    }

    // 2. Global Popup for Network/Server Errors
    if (!error.response) {
      toast.error("Network Error: Backend unreachable");
    } else if (error.response.status >= 500) {
      toast.error("Server Error: Something went wrong on the backend");
    }

    return Promise.reject(error);
  }
);

export default api;
