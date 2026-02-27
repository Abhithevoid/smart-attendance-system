import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Search, Plus, Edit2, Trash2, Shield,
  ChevronLeft, ChevronRight, X, Check, AlertTriangle,
  RefreshCw, Filter, MoreVertical, UserCheck, UserX,
  GraduationCap, Briefcase, Crown, ChevronDown,
} from "lucide-react";
import api from "../utils/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = ["all", "student", "teacher", "admin"];

const DEPARTMENTS = [
  "All Departments", "Computer Science", "Electrical Engineering",
  "Mechanical Engineering", "Civil Engineering", "Business Administration",
  "Mathematics", "Physics", "Chemistry", "Biology", "Other",
];

const ROLE_CONFIG = {
  admin:   { label: "Admin",   icon: Crown,         badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  teacher: { label: "Teacher", icon: Briefcase,     badge: "bg-blue-500/10   text-blue-400   border-blue-500/20"   },
  student: { label: "Student", icon: GraduationCap, badge: "bg-brand-500/10  text-brand-400  border-brand-500/20"  },
};

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                      text-xs font-mono border ${cfg.badge}`}>
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ isActive }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                      text-xs font-mono border
                      ${isActive
                        ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                        : "bg-surface-3 text-gray-500 border-surface-3"
                      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-brand-400" : "bg-gray-500"}`} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSave }) {
  const [form, setForm]     = useState({
    name:       user.name       || "",
    email:      user.email      || "",
    role:       user.role       || "student",
    department: user.department || "",
    phone:      user.phone      || "",
    isActive:   user.isActive   ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.email.trim()) { setError("Email is required"); return; }

    setLoading(true);
    try {
      const { data } = await api.put(`/user/${user._id}`, form);
      onSave(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-surface-1 border border-surface-2 rounded-2xl
                      w-full max-w-md shadow-2xl shadow-black/50 animate-fade-up"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20
                            rounded-lg flex items-center justify-center">
              <Edit2 size={14} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-sm">Edit User</h3>
              <p className="text-xs text-gray-500 font-mono">{user.universityId}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center
                       text-gray-500 hover:text-white hover:bg-surface-2 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20
                            rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Full Name <span className="text-brand-500">*</span>
            </label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="Full name"
              className="w-full bg-surface-2 border border-surface-3 rounded-lg
                         px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:border-blue-500/50 focus:ring-1
                         focus:ring-blue-500/20 transition-all" />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Email <span className="text-brand-500">*</span>
            </label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="Email address"
              className="w-full bg-surface-2 border border-surface-3 rounded-lg
                         px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:border-blue-500/50 focus:ring-1
                         focus:ring-blue-500/20 transition-all" />
          </div>

          {/* Role + Department row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Role</label>
              <div className="relative">
                <select name="role" value={form.role} onChange={handleChange}
                  className="w-full bg-surface-2 border border-surface-3 rounded-lg
                             px-3 py-2.5 text-sm text-gray-100 appearance-none
                             focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer pr-8">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2
                                                   text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Department</label>
              <div className="relative">
                <select name="department" value={form.department} onChange={handleChange}
                  className="w-full bg-surface-2 border border-surface-3 rounded-lg
                             px-3 py-2.5 text-sm text-gray-100 appearance-none
                             focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer pr-8">
                  <option value="">None</option>
                  {DEPARTMENTS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2
                                                   text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              placeholder="Phone number (optional)"
              className="w-full bg-surface-2 border border-surface-3 rounded-lg
                         px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:border-blue-500/50 focus:ring-1
                         focus:ring-blue-500/20 transition-all" />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between px-4 py-3
                          bg-surface-2 rounded-lg border border-surface-3">
            <div>
              <p className="text-sm text-gray-300 font-body">Account Status</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {form.isActive ? "User can login" : "User cannot login"}
              </p>
            </div>
            <button type="button"
              onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              className={`w-11 h-6 rounded-full transition-all duration-200 relative
                          ${form.isActive ? "bg-brand-500" : "bg-surface-3"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow
                                transition-all duration-200
                                ${form.isActive ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-surface-2 hover:bg-surface-3 border border-surface-3
                         text-gray-300 rounded-lg font-display text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50
                         text-white rounded-lg font-display text-sm transition-colors
                         flex items-center justify-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Check size={14} /> Save Changes</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────
function DeleteDialog({ user, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await onConfirm(user._id);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-surface-1 border border-surface-2 rounded-2xl
                      w-full max-w-sm shadow-2xl shadow-black/50 animate-fade-up p-6"
           onClick={e => e.stopPropagation()}>

        {/* Icon */}
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl
                        flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-400" />
        </div>

        {/* Text */}
        <h3 className="font-display font-bold text-white text-center text-lg">
          Delete User
        </h3>
        <p className="text-gray-500 text-sm text-center mt-2 font-body">
          Are you sure you want to delete{" "}
          <span className="text-white font-semibold">{user.name}</span>?
          This action cannot be undone.
        </p>

        {/* User info */}
        <div className="mt-4 px-4 py-3 bg-surface-2 rounded-lg border border-surface-3
                        flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20
                          flex items-center justify-center shrink-0">
            <span className="text-xs font-display font-bold text-red-400">
              {user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-200 font-body truncate">{user.name}</p>
            <p className="text-xs text-gray-500 font-mono truncate">{user.email}</p>
          </div>
          <RoleBadge role={user.role} />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-surface-2 hover:bg-surface-3 border border-surface-3
                       text-gray-300 rounded-lg font-display text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 disabled:opacity-50
                       text-white rounded-lg font-display text-sm transition-colors
                       flex items-center justify-center gap-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Trash2 size={14} /> Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [pagination, setPagination] = useState({});

  // Filters
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("");
  const [page,       setPage]       = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  // Modals
  const [editUser,   setEditUser]   = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch users ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search)                    params.set("search",     search);
      if (roleFilter !== "all")      params.set("role",       roleFilter);
      if (deptFilter)                params.set("department", deptFilter);
      params.set("page",  page);
      params.set("limit", 10);
      params.set("sortBy",  "createdAt");
      params.set("sortDir", "desc");

      const { data } = await api.get(`/user/all?${params.toString()}`);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, deptFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, roleFilter, deptFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSaveEdit = (updatedUser) => {
    setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
    setEditUser(null);
    showToast(`${updatedUser.name} updated successfully`);
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/user/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      setDeleteUser(null);
      showToast("User deleted successfully");
      if (users.length === 1 && page > 1) setPage(p => p - 1);
      else fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user", "error");
      setDeleteUser(null);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const { data } = await api.patch(`/user/${user._id}/toggle-status`);
      setUsers(prev => prev.map(u =>
        u._id === user._id ? { ...u, isActive: data.user.isActive } : u
      ));
      showToast(`${user.name} ${data.user.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl border
                         shadow-2xl animate-fade-up flex items-center gap-2 text-sm font-body
                         ${toast.type === "error"
                           ? "bg-red-500/10 border-red-500/20 text-red-400"
                           : "bg-brand-500/10 border-brand-500/20 text-brand-400"
                         }`}>
          {toast.type === "error"
            ? <AlertTriangle size={15} />
            : <Check size={15} />
          }
          {toast.message}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center
                      justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Shield size={22} className="text-purple-400" />
            User Management
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">
            {pagination.total
              ? `${pagination.total} total users`
              : "Manage all system users"}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface-3
                     border border-surface-3 text-gray-300 hover:text-white rounded-lg
                     font-display text-sm transition-all active:scale-[0.97]"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="animate-fade-up bg-surface-1 border border-surface-2
                      rounded-xl p-4 flex flex-col gap-3"
           style={{ animationDelay: "80ms" }}>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2
                                         text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email or university ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg
                         pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:border-brand-500/50 focus:ring-1
                         focus:ring-brand-500/20 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-gray-500 hover:text-gray-300 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilter(p => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border
                        font-display text-sm transition-all
                        ${showFilter
                          ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                          : "bg-surface-2 border-surface-3 text-gray-400 hover:text-white"
                        }`}
          >
            <Filter size={14} />
            Filters
            {(roleFilter !== "all" || deptFilter) && (
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Expanded filters */}
        {showFilter && (
          <div className="flex flex-wrap gap-3 pt-1 border-t border-surface-2">
            {/* Role filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Role:</span>
              {ROLES.map(r => (
                <button key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all
                              ${roleFilter === r
                                ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                                : "bg-surface-2 border-surface-3 text-gray-400 hover:text-white"
                              }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            {/* Department filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Dept:</span>
              <div className="relative">
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                  className="bg-surface-2 border border-surface-3 rounded-lg px-3 py-1.5
                             text-xs text-gray-300 appearance-none pr-7 cursor-pointer
                             focus:outline-none focus:border-brand-500/50 transition-all">
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d === "All Departments" ? "" : d}>{d}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2
                                                   text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Clear filters */}
            {(roleFilter !== "all" || deptFilter) && (
              <button
                onClick={() => { setRoleFilter("all"); setDeptFilter(""); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs
                           text-red-400 hover:text-white hover:bg-red-500/10
                           border border-red-500/20 font-mono transition-all"
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="animate-fade-up bg-surface-1 border border-surface-2 rounded-xl
                      overflow-hidden" style={{ animationDelay: "160ms" }}>

        {error ? (
          <div className="flex items-center justify-center py-16 gap-3 text-red-400">
            <AlertTriangle size={18} />
            <p className="text-sm font-body">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-2">
                  {["User", "University ID", "Role", "Department", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-mono
                                           text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(6).fill(null).map((_, i) => (
                    <tr key={i} className="border-b border-surface-2/50">
                      {Array(7).fill(null).map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-surface-2 rounded animate-pulse"
                               style={{ width: `${50 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-surface-2 rounded-xl
                                        flex items-center justify-center">
                          <Users size={20} className="text-gray-600" />
                        </div>
                        <p className="text-gray-500 text-sm font-body">No users found</p>
                        {(search || roleFilter !== "all" || deptFilter) && (
                          <button
                            onClick={() => { setSearch(""); setRoleFilter("all"); setDeptFilter(""); }}
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}
                      className="border-b border-surface-2/50 hover:bg-surface-2/30 transition-colors">

                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-500/10
                                          border border-brand-500/20 flex items-center
                                          justify-center shrink-0">
                            <span className="text-xs font-display font-bold text-brand-400">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-gray-200 font-body text-sm truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 font-mono truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* University ID */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-gray-400">{user.universityId}</span>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4"><RoleBadge role={user.role} /></td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-400 font-body">
                          {user.department || "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4"><StatusBadge isActive={user.isActive} /></td>

                      {/* Joined */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-500 font-mono">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {/* Edit */}
                          <button onClick={() => setEditUser(user)}
                            title="Edit user"
                            className="w-7 h-7 rounded-lg flex items-center justify-center
                                       text-gray-500 hover:text-blue-400 hover:bg-blue-500/10
                                       transition-colors">
                            <Edit2 size={13} />
                          </button>

                          {/* Toggle status */}
                          <button onClick={() => handleToggleStatus(user)}
                            title={user.isActive ? "Deactivate" : "Activate"}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center
                                        transition-colors
                                        ${user.isActive
                                          ? "text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                                          : "text-gray-500 hover:text-brand-400 hover:bg-brand-500/10"
                                        }`}>
                            {user.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>

                          {/* Delete */}
                          <button onClick={() => setDeleteUser(user)}
                            title="Delete user"
                            className="w-7 h-7 rounded-lg flex items-center justify-center
                                       text-gray-500 hover:text-red-400 hover:bg-red-500/10
                                       transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!loading && pagination.total > 0 && (
          <div className="flex items-center justify-between px-5 py-3
                          border-t border-surface-2">
            <p className="text-xs text-gray-500 font-mono">
              Showing{" "}
              <span className="text-gray-300">
                {((page - 1) * 10) + 1}–{Math.min(page * 10, pagination.total)}
              </span>
              {" "}of{" "}
              <span className="text-gray-300">{pagination.total}</span> users
            </p>

            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                           text-gray-400 hover:text-white hover:bg-surface-2
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) => p === "..." ? (
                  <span key={`d${idx}`} className="w-7 flex items-center justify-center
                                                    text-xs text-gray-600">···</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center
                                text-xs font-mono transition-colors
                                ${page === p
                                  ? "bg-brand-500 text-white"
                                  : "text-gray-400 hover:text-white hover:bg-surface-2"
                                }`}>
                    {p}
                  </button>
                ))
              }

              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                           text-gray-400 hover:text-white hover:bg-surface-2
                           disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {editUser   && <EditModal   user={editUser}   onClose={() => setEditUser(null)}   onSave={handleSaveEdit} />}
      {deleteUser && <DeleteDialog user={deleteUser} onClose={() => setDeleteUser(null)} onConfirm={handleDelete} />}
    </div>
  );
}