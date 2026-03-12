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

// Dashboard home pages
import AdminDashboard   from "./pages/dashboard/AdminDashboard";
import TeacherDashboard from "./pages/dashboard/TeacherDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";

// Shared pages
import AdminUsers      from "./pages/AdminUsers";
import AdminCourses     from "./pages/AdminCourses";
import AdminClassrooms  from "./pages/AdminClassrooms";
import AdminSessions    from "./pages/AdminSessions";
import AdminEnrollments from "./pages/AdminEnrollments";
import SystemSettings   from "./pages/SystemSettings";
import Profile          from "./pages/Profile";

// Teacher pages ✅
import TeacherCourses from "./pages/Teacher/TeacherCourses";
import SessionPage    from "./pages/Teacher/SessionPage";

// Student pages ✅
import StudentCourses from "./pages/Student/StudentCourses";
import ScanPage       from "./pages/Student/ScanPage";

// ─── Smart /dashboard redirect ────────────────────────────────────────────────
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
              <Route path="/dashboard/admin"               element={<AdminDashboard />} />
              <Route path="/dashboard/admin/users"         element={<AdminUsers />} />
              <Route path="/dashboard/admin/profile"       element={<Profile />} />
              <Route path="/dashboard/admin/courses"       element={<AdminCourses />} />
              <Route path="/dashboard/admin/classrooms"    element={<AdminClassrooms />} />
              <Route path="/dashboard/admin/sessions"      element={<AdminSessions />} />
              <Route path="/dashboard/admin/enrollments"   element={<AdminEnrollments />} />
              <Route path="/dashboard/admin/classes"       element={<AdminDashboard />} />
              <Route path="/dashboard/admin/attendance"    element={<AdminDashboard />} />
              <Route path="/dashboard/admin/reports"       element={<AdminDashboard />} />
              <Route path="/dashboard/admin/settings"      element={<SystemSettings />} />
            </Route>
          </Route>

          {/* ── Protected: Teacher ────────────────────────────── */}
          <Route element={<ProtectedRoute roles={["teacher"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/teacher"               element={<TeacherDashboard />} />
              <Route path="/dashboard/teacher/profile"       element={<Profile />} />
              <Route path="/dashboard/teacher/classes"       element={<TeacherCourses />} />
              <Route path="/dashboard/teacher/session/:id"   element={<SessionPage />} />  {/* ✅ Real QR page */}
              <Route path="/dashboard/teacher/attendance"    element={<TeacherDashboard />} />
              <Route path="/dashboard/teacher/students"      element={<TeacherDashboard />} />
              <Route path="/dashboard/teacher/reports"       element={<TeacherDashboard />} />
            </Route>
          </Route>

          {/* ── Protected: Student ────────────────────────────── */}
          <Route element={<ProtectedRoute roles={["student"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/student"              element={<StudentDashboard />} />
              <Route path="/dashboard/student/profile"      element={<Profile />} />
              <Route path="/dashboard/student/classes"      element={<StudentCourses />} />
              <Route path="/dashboard/student/scan/:id"     element={<ScanPage />} />
              <Route path="/dashboard/student/attendance"   element={<StudentDashboard />} />
            </Route>
          </Route>

          {/* ── 404 ───────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}