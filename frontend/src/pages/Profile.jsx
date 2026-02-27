import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import {
  User, Mail, Phone, Building, Hash, Shield,
  Lock, Eye, EyeOff, Check, AlertTriangle,
  Camera, Edit2, Save, X, KeyRound, Crown,
  GraduationCap, Briefcase, Calendar,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Business Administration", "Mathematics",
  "Physics", "Chemistry", "Biology", "Other",
];

const ROLE_CONFIG = {
  admin:   { label: "Administrator", icon: Crown,         color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  teacher: { label: "Teacher",       icon: Briefcase,     color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   },
  student: { label: "Student",       icon: GraduationCap, color: "text-brand-400",  bg: "bg-brand-500/10",  border: "border-brand-500/20"  },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl border
                     shadow-2xl animate-fade-up flex items-center gap-2 text-sm font-body
                     ${toast.type === "error"
                       ? "bg-red-500/10 border-red-500/20 text-red-400"
                       : "bg-brand-500/10 border-brand-500/20 text-brand-400"
                     }`}>
      {toast.type === "error" ? <AlertTriangle size={15} /> : <Check size={15} />}
      {toast.message}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="bg-surface-1 border border-surface-2 rounded-xl overflow-hidden
                    animate-fade-up">
      <div className="px-6 py-4 border-b border-surface-2 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${iconColor.replace("text-", "bg-").replace("400", "500/10")}
                         flex items-center justify-center`}>
          <Icon size={15} className={iconColor} />
        </div>
        <h2 className="font-display font-semibold text-white text-sm">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function InputEl({ icon: Icon, error, disabled, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2
                                          text-gray-500 pointer-events-none" />}
      <input
        {...props}
        disabled={disabled}
        className={`w-full bg-surface-2 border rounded-lg py-2.5 text-sm
                    text-gray-100 placeholder-gray-600
                    focus:outline-none focus:ring-1 transition-all duration-200
                    ${Icon ? "pl-9" : "px-4"} pr-4
                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    ${error
                      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                      : "border-surface-3 focus:border-brand-500 focus:ring-brand-500/30"
                    }`}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Profile() {
  const { user, updateProfile } = useAuth();

  // ── Profile form state ─────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name:       "",
    phone:      "",
    department: "",
  });
  const [profileErrors,  setProfileErrors]  = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);

  // ── Password form state ────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [passwordErrors,  setPasswordErrors]  = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords,   setShowPasswords]   = useState({
    current: false, new: false, confirm: false,
  });

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load user data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      setProfileForm({
        name:       user.name       || "",
        phone:      user.phone      || "",
        department: user.department || "",
      });
    }
  }, [user]);

  // ── Profile handlers ───────────────────────────────────────────────────────
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(p => ({ ...p, [name]: value }));
    if (profileErrors[name]) setProfileErrors(p => ({ ...p, [name]: "" }));
  };

  const validateProfile = () => {
    const errs = {};
    if (!profileForm.name.trim())         errs.name  = "Name is required";
    else if (profileForm.name.length < 2) errs.name  = "Name must be at least 2 characters";
    if (profileForm.phone && !/^[+]?[\d\s\-()\u0900-\u097F]{7,15}$/.test(profileForm.phone))
      errs.phone = "Invalid phone number";
    return errs;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = validateProfile();
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    setProfileLoading(true);
    try {
      const { data } = await api.put("/user/profile", profileForm);
      if (updateProfile) updateProfile(data.user);
      setProfileEditing(false);
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileForm({
      name:       user.name       || "",
      phone:      user.phone      || "",
      department: user.department || "",
    });
    setProfileErrors({});
    setProfileEditing(false);
  };

  // ── Password handlers ──────────────────────────────────────────────────────
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(p => ({ ...p, [name]: value }));
    if (passwordErrors[name]) setPasswordErrors(p => ({ ...p, [name]: "" }));
  };

  const validatePassword = () => {
    const errs = {};
    if (!passwordForm.currentPassword)
      errs.currentPassword = "Current password is required";
    if (!passwordForm.newPassword)
      errs.newPassword = "New password is required";
    else if (passwordForm.newPassword.length < 6)
      errs.newPassword = "Password must be at least 6 characters";
    if (!passwordForm.confirmPassword)
      errs.confirmPassword = "Please confirm your new password";
    else if (passwordForm.newPassword !== passwordForm.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    if (passwordForm.currentPassword === passwordForm.newPassword)
      errs.newPassword = "New password must be different from current";
    return errs;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePassword();
    if (Object.keys(errs).length) { setPasswordErrors(errs); return; }

    setPasswordLoading(true);
    try {
      await api.put("/user/profile", {
        currentPassword: passwordForm.currentPassword,
        newPassword:     passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      showToast("Password changed successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const toggleShowPassword = (field) => {
    setShowPasswords(p => ({ ...p, [field]: !p[field] }));
  };

  const roleCfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.student;
  const RoleIcon = roleCfg.icon;

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
      })
    : "—";

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <Toast toast={toast} />

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <User size={22} className="text-brand-400" />
          My Profile
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-body">
          Manage your personal information and account security
        </p>
      </div>

      {/* ── Profile Hero Card ─────────────────────────────────────────────── */}
      <div className="animate-fade-up bg-surface-1 border border-surface-2 rounded-xl p-6"
           style={{ animationDelay: "80ms" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border-2 border-brand-500/30
                            flex items-center justify-center">
              <span className="text-3xl font-display font-bold text-brand-400">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full
                             ${roleCfg.bg} ${roleCfg.border} border
                             flex items-center justify-center`}>
              <RoleIcon size={12} className={roleCfg.color} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-display font-bold text-white">{user?.name}</h2>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                                text-xs font-mono border ${roleCfg.bg} ${roleCfg.border} ${roleCfg.color}`}>
                <RoleIcon size={11} />
                {roleCfg.label}
              </span>
            </div>
            <p className="text-gray-400 text-sm font-body">{user?.email}</p>
            <div className="flex flex-wrap gap-4 mt-3">
              {user?.universityId && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                  <Hash size={12} className="text-gray-600" />
                  {user.universityId}
                </div>
              )}
              {user?.department && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                  <Building size={12} className="text-gray-600" />
                  {user.department}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
                <Calendar size={12} className="text-gray-600" />
                Joined {joinDate}
              </div>
            </div>
          </div>

          {/* Edit toggle */}
          {!profileEditing && (
            <button
              onClick={() => setProfileEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-surface-2 hover:bg-surface-3 border border-surface-3
                         text-gray-300 hover:text-white text-sm font-display
                         transition-all active:scale-[0.97] shrink-0"
            >
              <Edit2 size={14} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Personal Information ────────────────────────────────────────── */}
        <SectionCard icon={User} iconColor="text-brand-400" title="Personal Information">
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">

            {/* Read-only fields */}
            <Field label="Email Address">
              <InputEl icon={Mail} value={user?.email || ""} disabled readOnly
                placeholder="Email" />
              <p className="text-xs text-gray-600 font-mono">Email cannot be changed</p>
            </Field>

            <Field label="University ID">
              <InputEl icon={Hash} value={user?.universityId || ""} disabled readOnly
                placeholder="University ID" />
              <p className="text-xs text-gray-600 font-mono">University ID cannot be changed</p>
            </Field>

            {/* Editable fields */}
            <Field label="Full Name" error={profileErrors.name}>
              <InputEl
                icon={User}
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                placeholder="Your full name"
                disabled={!profileEditing}
                error={profileErrors.name}
              />
            </Field>

            <Field label="Phone Number" error={profileErrors.phone}>
              <InputEl
                icon={Phone}
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="Phone number (optional)"
                disabled={!profileEditing}
                error={profileErrors.phone}
              />
            </Field>

            <Field label="Department">
              {profileEditing ? (
                <div className="relative">
                  <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2
                                                  text-gray-500 pointer-events-none" />
                  <select
                    name="department"
                    value={profileForm.department}
                    onChange={handleProfileChange}
                    className="w-full bg-surface-2 border border-surface-3 rounded-lg
                               py-2.5 pl-9 pr-4 text-sm text-gray-100 appearance-none
                               focus:outline-none focus:border-brand-500 focus:ring-1
                               focus:ring-brand-500/30 transition-all cursor-pointer"
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              ) : (
                <InputEl icon={Building} value={profileForm.department || "Not set"}
                  disabled readOnly />
              )}
            </Field>

            {/* Action buttons */}
            {profileEditing && (
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleCancelEdit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5
                             bg-surface-2 hover:bg-surface-3 border border-surface-3
                             text-gray-300 rounded-lg font-display text-sm transition-colors">
                  <X size={14} /> Cancel
                </button>
                <button type="submit" disabled={profileLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5
                             bg-brand-500 hover:bg-brand-400 disabled:opacity-50
                             text-white rounded-lg font-display text-sm transition-colors">
                  {profileLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white
                                      rounded-full animate-spin" />
                    : <><Save size={14} /> Save Changes</>
                  }
                </button>
              </div>
            )}
          </form>
        </SectionCard>

        {/* ── Change Password ─────────────────────────────────────────────── */}
        <SectionCard icon={KeyRound} iconColor="text-yellow-400" title="Change Password">
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">

            {/* Current password */}
            <Field label="Current Password" error={passwordErrors.currentPassword}>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2
                                            text-gray-500 pointer-events-none" />
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className={`w-full bg-surface-2 border rounded-lg py-2.5 pl-9 pr-10
                              text-sm text-gray-100 placeholder-gray-600
                              focus:outline-none focus:ring-1 transition-all
                              ${passwordErrors.currentPassword
                                ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                                : "border-surface-3 focus:border-brand-500 focus:ring-brand-500/30"
                              }`}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => toggleShowPassword("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-500 hover:text-gray-300 transition-colors">
                  {showPasswords.current ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>

            {/* New password */}
            <Field label="New Password" error={passwordErrors.newPassword}>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2
                                            text-gray-500 pointer-events-none" />
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className={`w-full bg-surface-2 border rounded-lg py-2.5 pl-9 pr-10
                              text-sm text-gray-100 placeholder-gray-600
                              focus:outline-none focus:ring-1 transition-all
                              ${passwordErrors.newPassword
                                ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                                : "border-surface-3 focus:border-brand-500 focus:ring-brand-500/30"
                              }`}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => toggleShowPassword("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-500 hover:text-gray-300 transition-colors">
                  {showPasswords.new ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* Strength bar */}
              {passwordForm.newPassword && (
                <div className="flex gap-1.5 items-center mt-1">
                  {[1,2,3].map(lvl => {
                    const str = passwordForm.newPassword.length >= 10 ? 3
                               : passwordForm.newPassword.length >= 6  ? 2 : 1;
                    return (
                      <div key={lvl} className={`h-1 flex-1 rounded-full transition-all
                        ${lvl <= str
                          ? str === 1 ? "bg-red-500" : str === 2 ? "bg-yellow-500" : "bg-brand-500"
                          : "bg-surface-3"}`} />
                    );
                  })}
                  <span className="text-[10px] font-mono text-gray-500 ml-1">
                    {passwordForm.newPassword.length >= 10 ? "Strong"
                    : passwordForm.newPassword.length >= 6  ? "Medium" : "Weak"}
                  </span>
                </div>
              )}
            </Field>

            {/* Confirm password */}
            <Field label="Confirm New Password" error={passwordErrors.confirmPassword}>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2
                                            text-gray-500 pointer-events-none" />
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className={`w-full bg-surface-2 border rounded-lg py-2.5 pl-9 pr-10
                              text-sm text-gray-100 placeholder-gray-600
                              focus:outline-none focus:ring-1 transition-all
                              ${passwordErrors.confirmPassword
                                ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                                : passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword
                                ? "border-brand-500/50 focus:border-brand-500 focus:ring-brand-500/30"
                                : "border-surface-3 focus:border-brand-500 focus:ring-brand-500/30"
                              }`}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => toggleShowPassword("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-500 hover:text-gray-300 transition-colors">
                  {showPasswords.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* Match indicator */}
              {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                <p className="text-xs text-brand-400 flex items-center gap-1">
                  <Check size={11} /> Passwords match
                </p>
              )}
            </Field>

            <button type="submit" disabled={passwordLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5
                         bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20
                         hover:border-yellow-500/40 text-yellow-400 hover:text-yellow-300
                         rounded-lg font-display text-sm transition-all disabled:opacity-50
                         active:scale-[0.98]">
              {passwordLoading
                ? <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400
                                  rounded-full animate-spin" />
                : <><KeyRound size={14} /> Update Password</>
              }
            </button>
          </form>
        </SectionCard>
      </div>

      {/* ── Account Info ────────────────────────────────────────────────────── */}
      <div className="animate-fade-up bg-surface-1 border border-surface-2 rounded-xl p-5"
           style={{ animationDelay: "240ms" }}>
        <h2 className="font-display font-semibold text-white text-sm mb-4 flex items-center gap-2">
          <Shield size={15} className="text-gray-400" />
          Account Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Account ID",    value: user?._id?.slice(-8).toUpperCase() || "—" },
            { label: "Role",          value: roleCfg.label },
            { label: "Status",        value: user?.isActive !== false ? "Active" : "Inactive" },
            { label: "Member Since",  value: joinDate },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 bg-surface-2 rounded-lg border border-surface-3">
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-display font-semibold text-white mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}