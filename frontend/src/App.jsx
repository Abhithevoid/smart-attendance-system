import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";

import AdminDashboard from "./pages/dashboard/AdminDashboard";
import TeacherDashboard from "./pages/dashboard/TeacherDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/"             element={<Navigate to="/login" replace />} />

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["teacher"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["student"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/student" element={<StudentDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}