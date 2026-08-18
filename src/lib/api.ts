// ============================================================
// WAYTERO CUSTOMER — AXIOS API CLIENT
// Mirrors admin/partner patterns: Bearer + 401 refresh + retry.
// ============================================================
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const TOKEN_KEYS = {
  ACCESS: "wt_customer_access",
  REFRESH: "wt_customer_refresh",
};

let isRefreshing = false;
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  queue = [];
}

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS);
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH);
      if (!refreshToken) {
        clearSession();
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers["Authorization"] = `Bearer ${token}`;
          return apiClient(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        // The auth router returns tokens at the top level (no envelope) —
        // but tolerate both shapes in case a route is ever wrapped.
        const body = res.data as { data?: { access_token?: string }; access_token?: string };
        const newToken: string | undefined = body?.data?.access_token ?? body?.access_token;
        if (newToken) {
          localStorage.setItem(TOKEN_KEYS.ACCESS, newToken);
          processQueue(null, newToken);
          original.headers["Authorization"] = `Bearer ${newToken}`;
          return apiClient(original);
        }
        clearSession();
        return Promise.reject(error);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

function clearSession() {
  Object.values(TOKEN_KEYS).forEach((k) => localStorage.removeItem(k));
  // Reset the zustand auth store too — otherwise the persisted `user` keeps
  // the header logged-in while every API call 401s (zombie session).
  import("@/hooks/useAuth").then(({ useAuth }) => useAuth.getState().logout());
  // Dispatch a custom event so the site header can open the auth modal
  // instead of redirecting to /login (which is just a thin modal launcher
  // since we removed the standalone login form).
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("waytero:auth-required"));
  }
}

export default apiClient;
