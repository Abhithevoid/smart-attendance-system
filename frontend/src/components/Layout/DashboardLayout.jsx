import React, { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, BookOpen, ClipboardCheck,
  BarChart2, Settings, GraduationCap, UserCog,
  LogOut, Bell, Menu, X, ChevronDown, User,
} from "lucide-react";

// ─── Nav config per role ──────────────────────────────────────────────────────
const NAV_CONFIG = {
  admin: [
    { to: "/dashboard/admin",            icon: LayoutDashboard, label: "Overview"   },
    { to: "/dashboard/admin/users",      icon: Users,           label: "Users"      },
    { to: "/dashboard/admin/classes",    icon: BookOpen,        label: "Classes"    },
    { to: "/dashboard/admin/attendance", icon: ClipboardCheck,  label: "Attendance" },
    { to: "/dashboard/admin/reports",    icon: BarChart2,       label: "Reports"    },
    { to: "/dashboard/admin/settings",   icon: Settings,        label: "Settings"   },
  ],
  teacher: [
    { to: "/dashboard/teacher",              icon: LayoutDashboard, label: "Overview"        },
    { to: "/dashboard/teacher/classes",      icon: BookOpen,        label: "My Classes"      },
    { to: "/dashboard/teacher/attendance",   icon: ClipboardCheck,  label: "Mark Attendance" },
    { to: "/dashboard/teacher/students",     icon: GraduationCap,   label: "Students"        },
    { to: "/dashboard/teacher/reports",      icon: BarChart2,       label: "Reports"         },
  ],
  student: [
    { to: "/dashboard/student",            icon: LayoutDashboard, label: "Overview"    },
    { to: "/dashboard/student/attendance", icon: ClipboardCheck,  label: "Attendance"  },
    { to: "/dashboard/student/classes",    icon: BookOpen,        label: "My Classes"  },
    { to: "/dashboard/student/profile",    icon: UserCog,         label: "Profile"     },
  ],
};

const ROLE_COLORS = {
  admin:   { badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  teacher: { badge: "bg-blue-500/10   text-blue-400   border-blue-500/20"   },
  student: { badge: "bg-brand-500/10  text-brand-400  border-brand-500/20"  },
};

// ─── Sidebar content (shared between desktop + mobile) ────────────────────────
function SidebarContent({ onLinkClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV_CONFIG[user?.role] || [];
  const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.student;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-surface-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-display font-bold text-sm">SA</span>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-none">
              Smart Attendance
            </p>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-surface-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30
                          flex items-center justify-center shrink-0">
            <User size={16} className="text-brand-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-display font-semibold text-white truncate">
              {user?.name}
            </p>
            <p className="text-[11px] font-mono text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <div className="mt-2.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                            text-[11px] font-mono border ${roleColor.badge}`}>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest
                      px-3 mb-2">
          Navigation
        </p>
        <div className="flex flex-col gap-0.5">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onLinkClick}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-all duration-150 cursor-pointer
                ${isActive
                  ? "bg-brand-500/10 border border-brand-500/20 text-brand-400"
                  : "text-gray-400 hover:text-white hover:bg-surface-2 border border-transparent"
                }
              `}
            >
              <Icon size={16} className="shrink-0" />
              <span className="font-body">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-2 py-4 border-t border-surface-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                     text-gray-400 hover:text-red-400 hover:bg-red-500/10
                     border border-transparent hover:border-red-500/20
                     transition-all duration-150"
        >
          <LogOut size={16} className="shrink-0" />
          <span className="font-body">Logout</span>
        </button>
        <p className="text-[10px] font-mono text-gray-700 px-3 mt-3">
          v1.0.0 · Smart Attendance
        </p>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Prevent body scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleColor = ROLE_COLORS[user?.role] || ROLE_COLORS.student;

  return (
    <div className="min-h-screen flex bg-surface">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0
                        bg-surface-1 border-r border-surface-2
                        sticky top-0 h-screen overflow-hidden">
        <SidebarContent onLinkClick={() => {}} />
      </aside>

      {/* ── Mobile Sidebar Overlay ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ───────────────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-50 lg:hidden
        bg-surface-1 border-r border-surface-2
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg
                     flex items-center justify-center
                     text-gray-400 hover:text-white hover:bg-surface-2
                     transition-colors z-10"
        >
          <X size={16} />
        </button>
        <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Top Navbar ────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 h-14
                           bg-surface-1/80 backdrop-blur-md
                           border-b border-surface-2
                           flex items-center justify-between px-4 gap-4">

          {/* Left: hamburger (mobile) + page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center
                         text-gray-400 hover:text-white hover:bg-surface-2
                         transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center">
                <span className="text-white font-display font-bold text-[10px]">SA</span>
              </div>
              <span className="font-display font-semibold text-sm text-white">
                Smart Attendance
              </span>
            </div>
          </div>

          {/* Right: notifications + user menu */}
          <div className="flex items-center gap-2">

            {/* Notification bell */}
            <button className="w-9 h-9 rounded-lg flex items-center justify-center
                               text-gray-400 hover:text-white hover:bg-surface-2
                               transition-colors relative">
              <Bell size={17} />
              {/* Notification dot */}
              <span className="absolute top-2 right-2 w-1.5 h-1.5
                               bg-brand-500 rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg
                           hover:bg-surface-2 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-brand-500/20
                                border border-brand-500/30
                                flex items-center justify-center shrink-0">
                  <User size={13} className="text-brand-400" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-display font-semibold text-white leading-none">
                    {user?.name?.split(" ")[0]}
                  </p>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full
                                    border ${roleColor.badge}`}>
                    {user?.role}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-gray-500 transition-transform duration-200 hidden sm:block
                              ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48
                                bg-surface-1 border border-surface-2 rounded-xl
                                shadow-2xl shadow-black/40 overflow-hidden z-50
                                animate-fade-up">
                  <div className="px-4 py-3 border-b border-surface-2">
                    <p className="text-sm font-display font-semibold text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs font-mono text-gray-500 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate(`/dashboard/${user?.role}/profile`); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5
                                 text-sm text-gray-400 hover:text-white hover:bg-surface-2
                                 transition-colors text-left"
                    >
                      <UserCog size={15} />
                      Profile Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5
                                 text-sm text-red-400 hover:text-white hover:bg-red-500/10
                                 transition-colors text-left"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}