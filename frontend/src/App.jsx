import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Route guards & Layout
import ProtectedRoute  from "./components/ProtectedRoute";
import DashboardLayout from "./components/Layout/DashboardLayout";

// Public pages
import Login        from "./pages/Login";
import Register     from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";

// Dashboard pages
import AdminDashboard   from "./pages/dashboard/AdminDashboard";
import TeacherDashboard from "./pages/dashboard/TeacherDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";

// ─── Smart /dashboard redirect based on role ──────────────────────────────────
function DashboardRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  switch (user?.role) {
    case "admin":   return <Navigate to="/dashboard/admin"   replace />;
    case "teacher": return <Navigate to="/dashboard/teacher" replace />;
    case "student": return <Navigate to="/dashboard/student" replace />;
    default:        return <Navigate to="/login"             replace />;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ────────────────────────────────────────── */}
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ── Redirects ─────────────────────────────────────── */}
          <Route path="/"          element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* ── Protected: Admin ──────────────────────────────── */}
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/admin"   element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* ── Protected: Teacher ────────────────────────────── */}
          <Route element={<ProtectedRoute roles={["teacher"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
            </Route>
          </Route>

          {/* ── Protected: Student ────────────────────────────── */}
          <Route element={<ProtectedRoute roles={["student"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/student" element={<StudentDashboard />} />
            </Route>
          </Route>

          {/* ── 404 ───────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}