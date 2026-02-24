import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  BarChart2,
  Settings,
  GraduationCap,
  UserCog,
} from "lucide-react";

// Nav items per role
const navConfig = {
  admin: [
    { to: "/dashboard/admin",   icon: LayoutDashboard, label: "Overview" },
    { to: "/dashboard/admin/users",    icon: Users,           label: "Users" },
    { to: "/dashboard/admin/classes",  icon: BookOpen,        label: "Classes" },
    { to: "/dashboard/admin/attendance", icon: ClipboardCheck, label: "Attendance" },
    { to: "/dashboard/admin/reports",  icon: BarChart2,       label: "Reports" },
    { to: "/dashboard/admin/settings", icon: Settings,        label: "Settings" },
  ],
  teacher: [
    { to: "/dashboard/teacher",           icon: LayoutDashboard, label: "Overview" },
    { to: "/dashboard/teacher/classes",   icon: BookOpen,        label: "My Classes" },
    { to: "/dashboard/teacher/attendance",icon: ClipboardCheck,  label: "Mark Attendance" },
    { to: "/dashboard/teacher/reports",   icon: BarChart2,       label: "Reports" },
    { to: "/dashboard/teacher/students",  icon: GraduationCap,   label: "Students" },
  ],
  student: [
    { to: "/dashboard/student",              icon: LayoutDashboard, label: "Overview" },
    { to: "/dashboard/student/attendance",   icon: ClipboardCheck,  label: "My Attendance" },
    { to: "/dashboard/student/classes",      icon: BookOpen,        label: "My Classes" },
    { to: "/dashboard/student/profile",      icon: UserCog,         label: "Profile" },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const links = navConfig[user?.role] || [];

  return (
    <aside className="w-56 shrink-0 border-r border-surface-2 bg-surface-1
                      flex flex-col py-4 px-2 min-h-[calc(100vh-56px)]">
      <nav className="flex flex-col gap-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              isActive ? "nav-link-active" : "nav-link"
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom version tag */}
      <div className="mt-auto px-2 pt-4 border-t border-surface-2">
        <p className="text-[10px] font-mono text-gray-600">v1.0.0 · Smart Attendance</p>
      </div>
    </aside>
  );
}