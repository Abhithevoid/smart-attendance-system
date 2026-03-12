import axios from "axios";

// ─── Base Instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: "/api",           // proxied to http://localhost:5000 via vite.config.js
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ─── Request Interceptor: attach token ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // malformed storage — ignore
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: handle 401 + network errors ──────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → force logout
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }
    // Attach a friendly message for network / timeout errors
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      error.friendlyMessage = "Request timed out. Check your connection and try again.";
    } else if (!error.response) {
      // No response at all = server down / no internet
      error.friendlyMessage = "Cannot reach server. Please check your internet connection.";
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login", data),
};

// ─── User API ──────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile:    ()     => api.get("/user/profile"),
  updateProfile: (data) => api.put("/user/profile", data),
};

// ─── Future feature APIs (stubs ready to fill) ────────────────────────────────
export const attendanceAPI = {
  getAll:       (params) => api.get("/attendance", { params }),
  markPresent:  (data)   => api.post("/attendance/mark", data),
  getByStudent: (id)     => api.get(`/attendance/student/${id}`),
  getByClass:   (id)     => api.get(`/attendance/class/${id}`),
};

export const classAPI = {
  getAll:  ()     => api.get("/classes"),
  create:  (data) => api.post("/classes", data),
  getById: (id)   => api.get(`/classes/${id}`),
  update:  (id, data) => api.put(`/classes/${id}`, data),
  delete:  (id)   => api.delete(`/classes/${id}`),
};

export default api;