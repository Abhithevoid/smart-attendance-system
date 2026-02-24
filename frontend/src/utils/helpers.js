// ─── Role Helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the dashboard route for a given role
 */
export const getDashboardRoute = (role) => {
  switch (role) {
    case "admin":   return "/dashboard/admin";
    case "teacher": return "/dashboard/teacher";
    case "student": return "/dashboard/student";
    default:        return "/login";
  }
};

/**
 * Human-readable role label
 */
export const getRoleLabel = (role) => {
  const labels = { admin: "Administrator", teacher: "Teacher", student: "Student" };
  return labels[role] || role;
};

/**
 * Tailwind badge class by role
 */
export const getRoleBadgeClass = (role) => {
  const classes = {
    admin:   "badge-admin",
    teacher: "badge-teacher",
    student: "badge-student",
  };
  return classes[role] || "badge bg-surface-2 text-gray-400";
};

// ─── Date & Time ──────────────────────────────────────────────────────────────

/**
 * Format a date string to a readable format
 * e.g. "2024-01-15" → "Jan 15, 2024"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format a date to time string
 * e.g. "2024-01-15T10:30:00Z" → "10:30 AM"
 */
export const formatTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Relative time: "2 hours ago", "just now", etc.
 */
export const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1)  return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ─── Attendance Helpers ───────────────────────────────────────────────────────

/**
 * Calculate attendance percentage
 */
export const calcAttendancePercent = (present, total) => {
  if (!total) return 0;
  return Math.round((present / total) * 100);
};

/**
 * Return color class for attendance percentage
 */
export const getAttendanceColor = (percent) => {
  if (percent >= 75) return "text-brand-400";
  if (percent >= 50) return "text-yellow-400";
  return "text-red-400";
};

// ─── Validation ───────────────────────────────────────────────────────────────

export const validators = {
  required: (val) => (val?.trim() ? null : "This field is required"),
  email: (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : "Invalid email address",
  minLength: (min) => (val) =>
    val?.length >= min ? null : `Must be at least ${min} characters`,
  maxLength: (max) => (val) =>
    val?.length <= max ? null : `Must be at most ${max} characters`,
  phone: (val) =>
    !val || /^[+]?[\d\s\-()]{7,15}$/.test(val)
      ? null
      : "Invalid phone number",
};

// ─── Storage ──────────────────────────────────────────────────────────────────

export const storage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* quota exceeded */ }
  },
  remove: (key) => localStorage.removeItem(key),
};