import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getDashboardRoute = (role) => {
    if (role === "admin")   return "/dashboard/admin";
    if (role === "teacher") return "/dashboard/teacher";
    if (role === "student") return "/dashboard/student";
    return "/login";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4 text-center">
      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl
                      flex items-center justify-center mb-6">
        <span className="text-3xl">🚫</span>
      </div>
      <h1 className="text-2xl font-display font-bold text-white">Access Denied</h1>
      <p className="text-gray-500 text-sm mt-2 max-w-xs">
        You don't have permission to view this page.
      </p>
      <button
        onClick={() => navigate(getDashboardRoute(user?.role))}
        className="mt-6 bg-surface-2 hover:bg-surface-3 text-gray-300 hover:text-white
                   border border-surface-3 px-8 py-3 rounded-lg transition-all duration-200
                   font-display"
      >
        Go to my dashboard
      </button>
    </div>
  );
}