import React, { createContext, useContext, useReducer, useEffect } from "react";
import { authAPI } from "../utils/api";

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  user: null,          // { _id, name, email, role, token }
  isAuthenticated: false,
  isLoading: true,     // true on first mount while we check localStorage
  error: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case "AUTH_INIT":
      return { ...state, isLoading: false };

    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "UPDATE_PROFILE":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: restore user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        dispatch({ type: "LOGIN_SUCCESS", payload: user });
      } catch {
        localStorage.removeItem("user");
      }
    }
    dispatch({ type: "AUTH_INIT" });
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem("user", JSON.stringify(data));
      dispatch({ type: "LOGIN_SUCCESS", payload: data });
      return { success: true, role: data.role };
    } catch (error) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      dispatch({ type: "SET_ERROR", payload: message });
      return { success: false, error: message };
    }
  };

  const register = async (formData) => {
  dispatch({ type: "SET_LOADING", payload: true });
  dispatch({ type: "CLEAR_ERROR" });
  try {
    const { data } = await authAPI.register(formData);
    localStorage.setItem("user", JSON.stringify(data));
    dispatch({ type: "REGISTER_SUCCESS", payload: data });
    return { success: true, role: data.role };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.msg ||  // ← handles array format
      "Registration failed. Please try again.";
    dispatch({ type: "SET_ERROR", payload: message });
    return { success: false, error: message };
  }
};

  const logout = () => {
    localStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => dispatch({ type: "CLEAR_ERROR" });

  const updateProfile = (updatedFields) => {
    const updated = { ...state.user, ...updatedFields };
    localStorage.setItem("user", JSON.stringify(updated));
    dispatch({ type: "UPDATE_PROFILE", payload: updatedFields });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}