import React from "react";
import { useAuth } from "../context/AuthContext";
import { getRoleLabel, getRoleBadgeClass } from "../utils/helpers";
import { LogOut, User, Bell } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b border-surface-2 bg-surface-1/80 backdrop-blur-sm
                       flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: branding */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-brand-500 rounded-md flex items-center justify-center">
          <span className="text-white font-display font-bold text-xs">SA</span>
        </div>
        <span className="font-display font-semibold text-sm text-white tracking-tight hidden sm:block">
          Smart Attendance
        </span>
      </div>

      {/* Right: user info + actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell (placeholder) */}
        <button className="w-9 h-9 rounded-lg flex items-center justify-center
                           text-gray-400 hover:text-white hover:bg-surface-2
                           transition-colors">
          <Bell size={16} />
        </button>

        {/* Role badge */}
        {user?.role && (
          <span className={getRoleBadgeClass(user.role)}>
            {getRoleLabel(user.role)}
          </span>
        )}

        {/* User info */}
        <div className="flex items-center gap-2 pl-2 border-l border-surface-2">
          <div className="w-8 h-8 bg-brand-500/20 border border-brand-500/30
                          rounded-full flex items-center justify-center">
            <User size={14} className="text-brand-400" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-display text-white leading-none">{user?.name}</p>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Logout"
          className="w-9 h-9 rounded-lg flex items-center justify-center
                     text-gray-400 hover:text-red-400 hover:bg-red-500/10
                     transition-colors ml-1"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}