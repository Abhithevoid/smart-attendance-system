import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Users, BookOpen, ClipboardCheck, TrendingUp,
  UserPlus, Settings, BarChart2, AlertTriangle,
  CheckCircle2, Clock, ChevronRight, Shield,
  GraduationCap, Briefcase, Crown, Search,
  MoreVertical, RefreshCw, X, Check, ChevronDown,
} from "lucide-react";
import api from "../../utils/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Business Administration", "Mathematics",
  "Physics", "Chemistry", "Biology", "Other",
];

const ROLE_BADGE = {
  admin:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
  teacher: "bg-blue-500/10   text-blue-400   border-blue-500/20",
  student: "bg-brand-500/10  text-brand-400  border-brand-500/20",
};

const ROLE_ICON = {
  admin:   Crown,
  teacher: Briefcase,
  student: GraduationCap,
};

// ─── Add User Modal ───────────────────────────────────────────────────────────
function AddUserModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    universityId: "", role: "student", department: "", phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(p => ({ ...p, [name]: "" }));
    setError("");
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim())         errs.name         = "Name is required";
    if (!form.email.trim())        errs.email        = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.password)            errs.password     = "Password is required";
    else if (form.password.length < 6) errs.password = "Min 6 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.universityId.trim()) errs.universityId = "University ID is required";
    if (!form.role)                errs.role         = "Role is required";
    return errs;
  };

  const nextStep = () => {
    const errs = step === 1 ? validateStep1() : validateStep2();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await api.post("/auth/register", payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field) => `w-full bg-surface-2 border rounded-lg px-4 py-2.5
    text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1
    transition-all ${fieldErrors[field]
      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
      : "border-surface-3 focus:border-brand-500 focus:ring-brand-500/30"}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="bg-surface-1 border border-surface-2 rounded-2xl w-full max-w-md
                      shadow-2xl shadow-black/50 animate-fade-up"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/20
                            rounded-lg flex items-center justify-center">
              <UserPlus size={14} className="text-brand-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-sm">Add New User</h3>
              <p className="text-xs text-gray-500 font-mono">Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center
                       text-gray-500 hover:text-white hover:bg-surface-2 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1 px-6 pt-4">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300
              ${s <= step ? "bg-brand-500" : "bg-surface-3"}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20
                            rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                  Full Name <span className="text-brand-500">*</span>
                </label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Full name" className={inputCls("name")} />
                {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                  Email <span className="text-brand-500">*</span>
                </label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="Email address" className={inputCls("email")} />
                {fieldErrors.email && <p className="text-xs text-red-400">{fieldErrors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                    Password <span className="text-brand-500">*</span>
                  </label>
                  <input name="password" type="password" value={form.password}
                    onChange={handleChange} placeholder="Min 6 chars" className={inputCls("password")} />
                  {fieldErrors.password && <p className="text-xs text-red-400">{fieldErrors.password}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                    Confirm <span className="text-brand-500">*</span>
                  </label>
                  <input name="confirmPassword" type="password" value={form.confirmPassword}
                    onChange={handleChange} placeholder="Repeat" className={inputCls("confirmPassword")} />
                  {fieldErrors.confirmPassword && <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p>}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                  University ID <span className="text-brand-500">*</span>
                </label>
                <input name="universityId" value={form.universityId} onChange={handleChange}
                  placeholder="e.g. UNI123456" className={inputCls("universityId")} />
                {fieldErrors.universityId && <p className="text-xs text-red-400">{fieldErrors.universityId}</p>}
              </div>

              {/* Role cards */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                  Role <span className="text-brand-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["student", "teacher", "admin"].map(r => (
                    <button key={r} type="button"
                      onClick={() => setForm(p => ({ ...p, role: r }))}
                      className={`p-2.5 rounded-lg border text-center transition-all
                        ${form.role === r
                          ? "border-brand-500 bg-brand-500/10 text-brand-400"
                          : "border-surface-3 bg-surface-2 text-gray-400 hover:border-surface-4"
                        }`}>
                      <p className="text-xs font-display font-semibold capitalize">{r}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Department</label>
                  <div className="relative">
                    <select name="department" value={form.department} onChange={handleChange}
                      className="w-full bg-surface-2 border border-surface-3 rounded-lg
                                 px-3 py-2.5 text-sm text-gray-100 appearance-none pr-8
                                 focus:outline-none focus:border-brand-500 transition-all cursor-pointer">
                      <option value="">None</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2
                                                       text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder="Optional" className={inputCls("phone")} />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 py-2.5 bg-surface-2 hover:bg-surface-3 border border-surface-3
                           text-gray-300 rounded-lg font-display text-sm transition-colors">
                Back
              </button>
            )}
            {step === 1 ? (
              <button type="button" onClick={nextStep}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-400 text-white
                           rounded-lg font-display text-sm transition-colors flex
                           items-center justify-center gap-2">
                Continue <ChevronRight size={14} />
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-400 disabled:opacity-50
                           text-white rounded-lg font-display text-sm transition-colors flex
                           items-center justify-center gap-2">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Check size={14} /> Create User</>
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, change, changeColor, iconBg, iconColor, loading, delay }) {
  return (
    <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                    hover:border-surface-3 transition-all duration-200 animate-fade-up"
         style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">{label}</p>
          {loading ? (
            <div className="h-8 w-16 bg-surface-2 rounded animate-pulse mt-2" />
          ) : (
            <p className="text-3xl font-display font-bold text-white mt-2">{value}</p>
          )}
          <p className={`text-xs mt-1 font-body ${changeColor}`}>{change}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

// ─── Quick Link ───────────────────────────────────────────────────────────────
function QuickLink({ label, icon: Icon, color, bg, border, desc, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border
                  ${border} ${bg} hover:scale-[1.03] transition-all duration-150 text-center`}>
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon size={18} className={color} />
      </div>
      <p className={`text-xs font-display font-semibold ${color}`}>{label}</p>
      <p className="text-[10px] text-gray-600 font-body leading-tight">{desc}</p>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats,       setStats]       = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showAddUser,  setShowAddUser]  = useState(false);
  const [toast,        setToast]        = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch stats ─────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get("/user/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  // ── Fetch recent users ───────────────────────────────────────────────────────
  const fetchRecentUsers = async () => {
    setUsersLoading(true);
    try {
      const { data } = await api.get("/user/all?limit=6&sortBy=createdAt&sortDir=desc");
      setRecentUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users:", err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentUsers();
  }, []);

  // ── Handle add user success ──────────────────────────────────────────────────
  const handleAddUserSuccess = () => {
    setShowAddUser(false);
    showToast("User created successfully!");
    fetchStats();
    fetchRecentUsers();
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)     return "just now";
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl border
                         shadow-2xl animate-fade-up flex items-center gap-2 text-sm
                         ${toast.type === "error"
                           ? "bg-red-500/10 border-red-500/20 text-red-400"
                           : "bg-brand-500/10 border-brand-500/20 text-brand-400"
                         }`}>
          {toast.type === "error" ? <AlertTriangle size={15} /> : <Check size={15} />}
          {toast.message}
        </div>
      )}

      {/* ── Welcome Banner ──────────────────────────────────────────────────── */}
      <div className="animate-fade-up bg-gradient-to-r from-purple-500/10 to-transparent
                      border border-purple-500/20 rounded-xl px-6 py-5
                      flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-white">
            Admin Control Panel <span className="text-purple-400">👑</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">
            Welcome back, <span className="text-white">{user?.name}</span> · {today}
          </p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-400
                     text-white text-sm font-display rounded-lg transition-all duration-200
                     active:scale-[0.97] shrink-0 shadow-lg shadow-purple-500/20">
          <UserPlus size={16} /> Add New User
        </button>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap} label="Total Students"
          value={stats?.students ?? "—"}
          change={statsLoading ? "Loading..." : `${stats?.students || 0} registered`}
          changeColor="text-brand-400"
          iconBg="bg-brand-500/10" iconColor="text-brand-400"
          loading={statsLoading} delay="0ms"
        />
        <StatCard
          icon={Briefcase} label="Total Teachers"
          value={stats?.teachers ?? "—"}
          change={statsLoading ? "Loading..." : `${stats?.teachers || 0} registered`}
          changeColor="text-blue-400"
          iconBg="bg-blue-500/10" iconColor="text-blue-400"
          loading={statsLoading} delay="80ms"
        />
        <StatCard
          icon={Users} label="Total Users"
          value={stats?.total ?? "—"}
          change={statsLoading ? "Loading..." : `${stats?.active || 0} active · ${stats?.inactive || 0} inactive`}
          changeColor="text-gray-500"
          iconBg="bg-purple-500/10" iconColor="text-purple-400"
          loading={statsLoading} delay="160ms"
        />
        <StatCard
          icon={TrendingUp} label="Active Users"
          value={stats ? `${Math.round((stats.active / stats.total) * 100) || 0}%` : "—"}
          change={statsLoading ? "Loading..." : `${stats?.active || 0} of ${stats?.total || 0} users`}
          changeColor="text-yellow-400"
          iconBg="bg-yellow-500/10" iconColor="text-yellow-400"
          loading={statsLoading} delay="240ms"
        />
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{ animationDelay: "320ms" }}>
        <h2 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
          <Settings size={16} className="text-purple-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickLink label="Manage Users"    icon={Users}         color="text-brand-400"  bg="bg-brand-500/10"  border="border-brand-500/20"  desc="Add, edit, remove users"     onClick={() => navigate("/dashboard/admin/users")} />
          <QuickLink label="Manage Courses"  icon={BookOpen}      color="text-blue-400"   bg="bg-blue-500/10"   border="border-blue-500/20"   desc="Create and manage courses"   onClick={() => navigate("/dashboard/admin/classes")} />
          <QuickLink label="Attendance Logs" icon={ClipboardCheck}color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/20" desc="View attendance records"     onClick={() => navigate("/dashboard/admin/attendance")} />
          <QuickLink label="Reports"         icon={BarChart2}     color="text-yellow-400" bg="bg-yellow-500/10" border="border-yellow-500/20" desc="Generate system reports"    onClick={() => navigate("/dashboard/admin/reports")} />
          <QuickLink label="Settings"        icon={Settings}      color="text-gray-400"   bg="bg-surface-2"     border="border-surface-3"     desc="Configure system"           onClick={() => navigate("/dashboard/admin/settings")} />
          <QuickLink label="Add User"        icon={UserPlus}      color="text-red-400"    bg="bg-red-500/10"    border="border-red-500/20"    desc="Register new user"          onClick={() => setShowAddUser(true)} />
        </div>
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Users — REAL DATA */}
        <div className="lg:col-span-2 bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Users size={16} className="text-purple-400" /> Recent Users
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={fetchRecentUsers}
                className="w-7 h-7 rounded-lg flex items-center justify-center
                           text-gray-500 hover:text-white hover:bg-surface-2 transition-colors">
                <RefreshCw size={13} className={usersLoading ? "animate-spin" : ""} />
              </button>
              <button onClick={() => navigate("/dashboard/admin/users")}
                className="text-xs text-purple-400 hover:text-purple-300
                           flex items-center gap-1 transition-colors">
                View all <ChevronRight size={12} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-2">
                  {["Name", "Role", "Department", "Status", "Joined", ""].map(h => (
                    <th key={h} className="py-2.5 px-3 text-left text-xs font-mono
                                           text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  Array(5).fill(null).map((_, i) => (
                    <tr key={i} className="border-b border-surface-2/50">
                      {Array(6).fill(null).map((_, j) => (
                        <td key={j} className="py-3 px-3">
                          <div className="h-3.5 bg-surface-2 rounded animate-pulse"
                               style={{ width: `${50 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-600 text-xs font-mono">
                      No users found
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u) => {
                    const RIcon = ROLE_ICON[u.role] || Users;
                    return (
                      <tr key={u._id}
                        className="border-b border-surface-2/50 hover:bg-surface-2/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-500/10 border
                                            border-brand-500/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-display font-bold text-brand-400">
                                {u.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-gray-200 text-xs font-body truncate max-w-[120px]">{u.name}</p>
                              <p className="text-gray-600 text-[10px] font-mono truncate max-w-[120px]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5
                                            rounded-full text-xs font-mono border ${ROLE_BADGE[u.role]}`}>
                            <RIcon size={9} />{u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 font-body">
                          {u.department || "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-full border
                            ${u.isActive
                              ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                              : "bg-surface-2 text-gray-500 border-surface-3"
                            }`}>
                            {u.isActive ? "active" : "inactive"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 font-mono">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => navigate("/dashboard/admin/users")}
                            className="w-6 h-6 rounded flex items-center justify-center
                                       text-gray-600 hover:text-white hover:bg-surface-2
                                       transition-colors">
                            <MoreVertical size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-2">
            <p className="text-xs text-gray-500 font-mono">
              Showing {recentUsers.length} most recent users
              {stats?.total && <span className="text-gray-400"> of {stats.total} total</span>}
            </p>
            <button onClick={() => navigate("/dashboard/admin/users")}
              className="text-xs text-purple-400 hover:text-purple-300
                         flex items-center gap-1 transition-colors">
              Manage all users <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* System Overview */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "480ms" }}>
          <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={16} className="text-purple-400" /> System Overview
          </h2>

          {statsLoading ? (
            <div className="flex flex-col gap-3">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {[
                { label: "Total Users",    value: stats?.total    || 0, color: "text-white"      },
                { label: "Students",       value: stats?.students || 0, color: "text-brand-400"  },
                { label: "Teachers",       value: stats?.teachers || 0, color: "text-blue-400"   },
                { label: "Admins",         value: stats?.admins   || 0, color: "text-purple-400" },
                { label: "Active Users",   value: stats?.active   || 0, color: "text-brand-400"  },
                { label: "Inactive Users", value: stats?.inactive || 0, color: "text-gray-500"   },
              ].map(({ label, value, color }) => (
                <div key={label}
                  className="flex items-center justify-between px-4 py-2.5
                             bg-surface-2 rounded-lg border border-surface-3">
                  <span className="text-xs font-mono text-gray-500">{label}</span>
                  <span className={`text-sm font-display font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { fetchStats(); fetchRecentUsers(); }}
            className="w-full mt-4 py-2 text-xs text-gray-500 hover:text-white
                       border border-surface-2 hover:border-surface-3 rounded-lg
                       font-display transition-colors flex items-center justify-center gap-1">
            <RefreshCw size={11} className={statsLoading ? "animate-spin" : ""} />
            Refresh Stats
          </button>
        </div>
      </div>

      {/* ── Add User Modal ─────────────────────────────────────────────────── */}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSuccess={handleAddUserSuccess}
        />
      )}
    </div>
  );
}