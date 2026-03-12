import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Search, Plus, Edit2, Trash2, X, Check,
  AlertTriangle, RefreshCw, Filter, MoreVertical,
  ChevronDown, ChevronLeft, ChevronRight, MapPin,
  GraduationCap, Briefcase, Calendar, Clock, Users,
  ToggleLeft, ToggleRight, Building2,
} from "lucide-react";
import api from "../utils/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Business Administration", "Mathematics",
  "Physics", "Chemistry", "Biology", "Information Technology", "Other",
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, showToast: show };
}

// ─── Edit / Create Modal ──────────────────────────────────────────────────────
function CourseModal({ course, teachers, classrooms, onClose, onSave }) {
  const isEdit = !!course?._id;

  const [form, setForm] = useState({
    name:        course?.name        || "",
    code:        course?.code        || "",
    description: course?.description || "",
    department:  course?.department  || "",
    semester:    course?.semester    || "",
    credits:     course?.credits     ?? 3,
    academicYear:course?.academicYear|| "",
    teacherId:   course?.teacherId?._id || course?.teacherId || "",
    schedule:    course?.schedule    || [],
    locationCoordinates: {
      lat:    course?.locationCoordinates?.lat    ?? "",
      lng:    course?.locationCoordinates?.lng    ?? "",
      radius: course?.locationCoordinates?.radius ?? 100,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleChange = (name, value) => {
    setForm(p => ({ ...p, [name]: value }));
    setError("");
  };

  /* ── Schedule helpers ── */
  const addSchedule = () => {
    setForm(p => ({
      ...p,
      schedule: [...p.schedule, { day: "Monday", startTime: "09:00", endTime: "10:00", location: "" }],
    }));
  };
  const updateSchedule = (i, field, val) => {
    setForm(p => {
      const s = [...p.schedule];
      s[i] = { ...s[i], [field]: val };
      return { ...p, schedule: s };
    });
  };
  const removeSchedule = (i) => {
    setForm(p => ({ ...p, schedule: p.schedule.filter((_, idx) => idx !== i) }));
  };

  /* ── Classroom selection → auto-fill coords ── */
  const handleClassroomSelect = (classroomId) => {
    if (!classroomId) {
      handleChange("locationCoordinates", { lat: "", lng: "", radius: 100 });
      return;
    }
    const c = classrooms.find(cl => cl.value === classroomId || cl._id === classroomId);
    if (c) {
      setForm(p => ({
        ...p,
        locationCoordinates: {
          lat:    c.lat    ?? "",
          lng:    c.lng    ?? "",
          radius: c.radius ?? 100,
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())     { setError("Course name is required"); return; }
    if (!form.code.trim())     { setError("Course code is required"); return; }
    if (!form.teacherId)       { setError("Teacher must be assigned"); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        semester: form.semester ? Number(form.semester) : undefined,
        credits:  form.credits  ? Number(form.credits)  : undefined,
        locationCoordinates: form.locationCoordinates.lat
          ? {
              lat:    Number(form.locationCoordinates.lat),
              lng:    Number(form.locationCoordinates.lng),
              radius: Number(form.locationCoordinates.radius) || 100,
            }
          : undefined,
      };

      if (isEdit) {
        const { data } = await api.put(`/course/${course._id}`, payload);
        onSave(data.course, "updated");
      } else {
        const { data } = await api.post("/course", payload);
        onSave(data.course, "created");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-1 border border-surface-2 rounded-2xl
                      w-full max-w-2xl max-h-[90vh] overflow-y-auto
                      shadow-2xl shadow-black/50 animate-fade-up"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2 sticky top-0 bg-surface-1 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500/10 border border-brand-500/20
                            rounded-lg flex items-center justify-center">
              <BookOpen size={14} className="text-brand-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-sm">
                {isEdit ? "Edit Course" : "Create Course"}
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                {isEdit ? course.code : "Fill in course details"}
              </p>
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

          {/* Name + Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Name <span className="text-brand-500">*</span>
              </label>
              <input value={form.name} onChange={e => handleChange("name", e.target.value)}
                placeholder="e.g., Data Structures"
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:border-brand-500/50 focus:ring-1
                           focus:ring-brand-500/20 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Code <span className="text-brand-500">*</span>
              </label>
              <input value={form.code}
                onChange={e => handleChange("code", e.target.value.toUpperCase())}
                placeholder="e.g., CS301"
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 uppercase
                           focus:outline-none focus:border-brand-500/50 focus:ring-1
                           focus:ring-brand-500/20 transition-all" />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => handleChange("description", e.target.value)}
              placeholder="Brief course description…" rows={2}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg
                         px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 resize-none
                         focus:outline-none focus:border-brand-500/50 focus:ring-1
                         focus:ring-brand-500/20 transition-all" />
          </div>

          {/* Department + Semester + Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Department</label>
              <div className="relative">
                <select value={form.department} onChange={e => handleChange("department", e.target.value)}
                  className="w-full bg-surface-2 border border-surface-3 rounded-lg
                             px-3 py-2.5 text-sm text-gray-100 appearance-none
                             focus:outline-none focus:border-brand-500/50 transition-all pr-8">
                  <option value="">None</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Semester</label>
              <div className="relative">
                <select value={form.semester} onChange={e => handleChange("semester", e.target.value)}
                  className="w-full bg-surface-2 border border-surface-3 rounded-lg
                             px-3 py-2.5 text-sm text-gray-100 appearance-none
                             focus:outline-none focus:border-brand-500/50 transition-all pr-8">
                  <option value="">—</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Credits</label>
              <input type="number" min={1} max={6} value={form.credits}
                onChange={e => handleChange("credits", e.target.value)}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-4 py-2.5 text-sm text-gray-100
                           focus:outline-none focus:border-brand-500/50 focus:ring-1
                           focus:ring-brand-500/20 transition-all" />
            </div>
          </div>

          {/* Academic Year */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Academic Year</label>
            <input value={form.academicYear} onChange={e => handleChange("academicYear", e.target.value)}
              placeholder="e.g., 2025-26"
              className="w-full bg-surface-2 border border-surface-3 rounded-lg
                         px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:border-brand-500/50 focus:ring-1
                         focus:ring-brand-500/20 transition-all" />
          </div>

          {/* Teacher */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Assign Teacher <span className="text-brand-500">*</span>
            </label>
            <div className="relative">
              <select value={form.teacherId} onChange={e => handleChange("teacherId", e.target.value)}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-3 py-2.5 text-sm text-gray-100 appearance-none
                           focus:outline-none focus:border-brand-500/50 transition-all pr-8">
                <option value="">Select teacher…</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name} — {t.email}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Classroom + Geofence */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Assign Classroom (Geofence)
            </label>
            <div className="relative">
              <select onChange={e => handleClassroomSelect(e.target.value)}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-3 py-2.5 text-sm text-gray-100 appearance-none
                           focus:outline-none focus:border-brand-500/50 transition-all pr-8">
                <option value="">Select classroom…</option>
                {classrooms.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label} — GPS: {c.lat ?? "N/A"}, {c.lng ?? "N/A"} (r={c.radius}m)
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Lat / Lng / Radius manual */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Latitude</label>
              <input type="number" step="any" value={form.locationCoordinates.lat}
                onChange={e => setForm(p => ({
                  ...p, locationCoordinates: { ...p.locationCoordinates, lat: e.target.value },
                }))}
                placeholder="28.6142"
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-3 py-2.5 text-sm text-gray-100 font-mono placeholder-gray-600
                           focus:outline-none focus:border-brand-500/50 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Longitude</label>
              <input type="number" step="any" value={form.locationCoordinates.lng}
                onChange={e => setForm(p => ({
                  ...p, locationCoordinates: { ...p.locationCoordinates, lng: e.target.value },
                }))}
                placeholder="77.209"
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-3 py-2.5 text-sm text-gray-100 font-mono placeholder-gray-600
                           focus:outline-none focus:border-brand-500/50 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Radius (m)</label>
              <input type="number" min={10} max={1000} value={form.locationCoordinates.radius}
                onChange={e => setForm(p => ({
                  ...p, locationCoordinates: { ...p.locationCoordinates, radius: e.target.value },
                }))}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-3 py-2.5 text-sm text-gray-100 font-mono
                           focus:outline-none focus:border-brand-500/50 transition-all" />
            </div>
          </div>

          {form.locationCoordinates.lat && form.locationCoordinates.lng && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                            bg-brand-500/5 border border-brand-500/10">
              <MapPin size={12} className="text-brand-400" />
              <span className="text-xs text-brand-300 font-mono">
                GPS: {form.locationCoordinates.lat}, {form.locationCoordinates.lng}
              </span>
              <span className="text-gray-600 text-xs">•</span>
              <span className="text-xs text-gray-500">Radius: {form.locationCoordinates.radius}m</span>
            </div>
          )}

          {/* Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Schedule</label>
              <button type="button" onClick={addSchedule}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                <Plus size={12} /> Add Slot
              </button>
            </div>
            {form.schedule.length === 0 && (
              <p className="text-xs text-gray-600 italic py-2 text-center">No schedule slots</p>
            )}
            <div className="flex flex-col gap-2">
              {form.schedule.map((slot, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg
                                        bg-surface-2 border border-surface-3">
                  <select value={slot.day} onChange={e => updateSchedule(i, "day", e.target.value)}
                    className="bg-surface-3 border border-surface-3 rounded px-2 py-1.5
                               text-xs text-gray-100 appearance-none focus:outline-none">
                    {DAYS.map(d => <option key={d} value={d}>{d.slice(0, 3)}</option>)}
                  </select>
                  <input type="time" value={slot.startTime}
                    onChange={e => updateSchedule(i, "startTime", e.target.value)}
                    className="bg-surface-3 border border-surface-3 rounded px-2 py-1.5
                               text-xs text-gray-100 focus:outline-none" />
                  <span className="text-gray-600 text-xs">→</span>
                  <input type="time" value={slot.endTime}
                    onChange={e => updateSchedule(i, "endTime", e.target.value)}
                    className="bg-surface-3 border border-surface-3 rounded px-2 py-1.5
                               text-xs text-gray-100 focus:outline-none" />
                  <input value={slot.location || ""} placeholder="Room"
                    onChange={e => updateSchedule(i, "location", e.target.value)}
                    className="flex-1 bg-surface-3 border border-surface-3 rounded px-2 py-1.5
                               text-xs text-gray-100 placeholder-gray-600 focus:outline-none min-w-[80px]" />
                  <button type="button" onClick={() => removeSchedule(i)}
                    className="w-6 h-6 rounded flex items-center justify-center
                               text-red-400 hover:bg-red-500/10 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 bg-surface-2 hover:bg-surface-3 border border-surface-3
                         text-gray-300 hover:text-white rounded-lg font-display text-sm
                         transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg
                         font-display text-sm transition-all disabled:opacity-50
                         flex items-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Check size={15} />}
              {isEdit ? "Update Course" : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────
function DeleteModal({ course, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await onConfirm(course._id);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-1 border border-surface-2 rounded-2xl
                      w-full max-w-sm shadow-2xl shadow-black/50 animate-fade-up p-6 text-center"
           onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10
                        flex items-center justify-center">
          <AlertTriangle size={24} className="text-red-400" />
        </div>
        <h3 className="text-base font-display font-bold text-white mb-1">Delete Course?</h3>
        <p className="text-gray-400 text-sm mb-1">
          <span className="text-white font-semibold">{course.name}</span>
        </p>
        <p className="text-gray-600 text-xs font-mono mb-5">{course.code}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose}
            className="px-5 py-2.5 bg-surface-2 hover:bg-surface-3 border border-surface-3
                       text-gray-300 rounded-lg text-sm font-display transition-all">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20
                       text-red-400 rounded-lg text-sm font-display transition-all
                       disabled:opacity-50 flex items-center gap-2">
            {loading && <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminCourses() {
  const [courses, setCourses]       = useState([]);
  const [teachers, setTeachers]     = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [loading, setLoading]       = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const [search, setSearch]         = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [semFilter, setSemFilter]   = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage]             = useState(1);

  const [modal, setModal]           = useState(null);   // null | "create" | course obj
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMenu, setOpenMenu]     = useState(null);

  const { toast, showToast } = useToast();
  const menuRef = useRef(null);

  // ── Fetch courses ──
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search)     params.set("search", search);
      if (deptFilter) params.set("department", deptFilter);
      if (semFilter)  params.set("semester", semFilter);
      params.set("page", page);
      params.set("limit", 20);

      const { data } = await api.get(`/course/all?${params}`);
      setCourses(data.courses || []);
      setPagination(data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      console.error("fetchCourses:", err);
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, semFilter, page]);

  // ── Fetch teachers + classrooms once ──
  const fetchMeta = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        api.get("/user/all?role=teacher&limit=200"),
        api.get("/classroom/dropdown"),
      ]);
      setTeachers(tRes.data.users || []);
      setClassrooms(cRes.data.classrooms || []);
    } catch (err) {
      console.error("fetchMeta:", err);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { setPage(1); }, [search, deptFilter, semFilter]);

  // ── Handlers ──
  const handleSave = (course, action) => {
    setModal(null);
    fetchCourses();
    showToast(`${course.name || "Course"} ${action} successfully`);
  };

  const handleDelete = async (courseId) => {
    try {
      await api.delete(`/course/${courseId}`);
      setDeleteTarget(null);
      fetchCourses();
      showToast("Course deleted successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete course", "error");
      setDeleteTarget(null);
    }
  };

  const handleToggle = async (course) => {
    try {
      const { data } = await api.patch(`/course/${course._id}/toggle`);
      setCourses(p => p.map(c =>
        c._id === course._id ? { ...c, isActive: data.course.isActive } : c
      ));
      showToast(`${course.name} ${data.course.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to toggle status", "error");
    }
  };

  // ── Render ──
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl border
                         shadow-2xl animate-fade-up flex items-center gap-2 text-sm font-body
                         ${toast.type === "error"
                           ? "bg-red-500/10 border-red-500/20 text-red-400"
                           : "bg-brand-500/10 border-brand-500/20 text-brand-400"
                         }`}>
          {toast.type === "error" ? <AlertTriangle size={15} /> : <Check size={15} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <BookOpen size={22} className="text-brand-400" />
            Course Management
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">
            {pagination.total ? `${pagination.total} total courses` : "Manage all courses"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchCourses}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface-3
                       border border-surface-3 text-gray-300 hover:text-white rounded-lg
                       font-display text-sm transition-all active:scale-[0.97]">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600
                       text-white rounded-lg font-display text-sm transition-all
                       active:scale-[0.97] shadow-lg shadow-brand-500/20">
            <Plus size={16} /> Create Course
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="animate-fade-up bg-surface-1 border border-surface-2 rounded-xl p-4 flex flex-col gap-3"
           style={{ animationDelay: "80ms" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input type="text" placeholder="Search by name or code…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg
                         pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:border-brand-500/50 focus:ring-1
                         focus:ring-brand-500/20 transition-all" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilter(p => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-display text-sm transition-all
                        ${showFilter
                          ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                          : "bg-surface-2 border-surface-3 text-gray-400 hover:text-white"
                        }`}>
            <Filter size={14} /> Filters
            {(deptFilter || semFilter) && <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />}
          </button>
        </div>

        {showFilter && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-surface-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Dept:</span>
              <div className="relative">
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                  className="bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-xs text-gray-100 appearance-none pr-7 focus:outline-none">
                  <option value="">All</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Sem:</span>
              <div className="relative">
                <select value={semFilter} onChange={e => setSemFilter(e.target.value)}
                  className="bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-xs text-gray-100 appearance-none pr-7 focus:outline-none">
                  <option value="">All</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            {(deptFilter || semFilter) && (
              <button onClick={() => { setDeptFilter(""); setSemFilter(""); }}
                className="text-xs text-gray-500 hover:text-brand-400 transition-colors flex items-center gap-1">
                <X size={11} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="animate-fade-up bg-surface-1 border border-surface-2 rounded-xl overflow-hidden"
           style={{ animationDelay: "160ms" }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <BookOpen size={36} className="text-gray-700 mb-3" />
            <p className="text-gray-400 font-display font-medium">No courses found</p>
            <p className="text-gray-600 text-sm mt-1 font-body">Create your first course to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-2">
                  {["Course", "Department", "Sem", "Teacher", "Location", "Schedule", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest
                                           text-gray-500 font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {courses.map(c => (
                  <tr key={c._id} className="hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-white font-display font-semibold">{c.name}</p>
                      <p className="text-gray-500 text-xs font-mono">{c.code}</p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">{c.department || "—"}</td>
                    <td className="px-4 py-3.5">
                      {c.semester ? (
                        <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-mono">
                          {c.semester}
                        </span>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-gray-300 text-xs">{c.teacherId?.name || "—"}</p>
                      <p className="text-gray-600 text-[10px] font-mono">{c.teacherId?.email || ""}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {c.locationCoordinates?.lat ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={11} className="text-brand-400" />
                          <span className="text-gray-400 text-[10px] font-mono">
                            {c.locationCoordinates.lat}, {c.locationCoordinates.lng}
                          </span>
                        </div>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {c.schedule?.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-gray-500" />
                          <span className="text-gray-400 text-xs">{c.schedule.length} slots</span>
                        </div>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => handleToggle(c)}
                        className="flex items-center gap-1.5 group">
                        {c.isActive
                          ? <ToggleRight size={18} className="text-brand-400 group-hover:text-brand-300" />
                          : <ToggleLeft  size={18} className="text-gray-600 group-hover:text-gray-400" />}
                        <span className={`text-xs font-mono ${c.isActive ? "text-brand-400" : "text-gray-600"}`}>
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="relative">
                        <button onClick={() => setOpenMenu(openMenu === c._id ? null : c._id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center
                                     text-gray-500 hover:text-white hover:bg-surface-2 transition-colors">
                          <MoreVertical size={14} />
                        </button>
                        {openMenu === c._id && (
                          <div className="absolute right-0 top-8 w-32 bg-surface-2 border border-surface-3
                                          rounded-lg shadow-xl py-1 z-20">
                            <button onClick={() => { setModal(c); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300
                                         hover:bg-surface-3 transition-colors">
                              <Edit2 size={12} /> Edit
                            </button>
                            <button onClick={() => { setDeleteTarget(c); setOpenMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400
                                         hover:bg-red-500/10 transition-colors">
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-2">
            <p className="text-xs text-gray-500 font-mono">
              Page {pagination.page} of {pagination.totalPages} • {pagination.total} courses
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                           bg-surface-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                           bg-surface-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <CourseModal
          course={modal === "create" ? null : modal}
          teachers={teachers}
          classrooms={classrooms}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          course={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Click-away for action menus */}
      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
