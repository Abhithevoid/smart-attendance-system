import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Search, Plus, Trash2, X, RefreshCw, Filter,
  ChevronDown, ChevronLeft, ChevronRight, BookOpen,
  UserPlus, Upload, Download, GraduationCap, AlertTriangle,
} from "lucide-react";
import api from "../utils/api";

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, showToast: show };
}

// ─── Enroll Modal ─────────────────────────────────────────────────────────────
function EnrollModal({ courseId, courseName, existingIds, onClose, onDone }) {
  const [students, setStudents]     = useState([]);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [mode, setMode]             = useState("manual"); // manual | bulk
  const [csvText, setCsvText]       = useState("");

  // Fetch students not already enrolled
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/user/all?role=student");
        const list = (data.users || data || []).filter(
          u => !existingIds.includes(u._id)
        );
        setStudents(list);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [existingIds]);

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleEnroll = async () => {
    setSaving(true);
    try {
      if (mode === "bulk" && csvText.trim()) {
        // Parse CSV: support university IDs or object IDs, one per line
        const ids = csvText
          .split(/[\n,]+/)
          .map(s => s.trim())
          .filter(Boolean);

        // Match by universityId first, fallback to _id
        const matchedIds = ids.map(raw => {
          const found = students.find(
            s => s.universityId === raw || s._id === raw || s.email === raw
          );
          return found?._id;
        }).filter(Boolean);

        if (matchedIds.length === 0) {
          onDone("No matching students found", "error");
          return;
        }

        await api.post("/enrollment/enroll-bulk", {
          courseId,
          studentIds: matchedIds,
        });
        onDone(`Enrolled ${matchedIds.length} student(s)`);
      } else {
        if (selected.length === 0) {
          onDone("Select at least one student", "error");
          return;
        }
        await api.post("/enrollment/enroll-bulk", {
          courseId,
          studentIds: selected,
        });
        onDone(`Enrolled ${selected.length} student(s)`);
      }
    } catch (err) {
      onDone(err.response?.data?.message || "Enrollment failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.universityId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-1 border border-surface-3 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div>
            <h3 className="font-display font-bold text-white">Enroll Students</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{courseName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="px-6 pt-4 flex gap-2">
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 rounded-lg text-xs font-mono border transition
              ${mode === "manual"
                ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                : "bg-surface-2 text-gray-400 border-surface-3 hover:border-gray-600"}`}
          >
            <UserPlus size={14} className="inline mr-1" /> Select Students
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`flex-1 py-2 rounded-lg text-xs font-mono border transition
              ${mode === "bulk"
                ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                : "bg-surface-2 text-gray-400 border-surface-3 hover:border-gray-600"}`}
          >
            <Upload size={14} className="inline mr-1" /> Bulk / CSV
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {mode === "manual" ? (
            <>
              {/* Search */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search students…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-2 border border-surface-3 rounded-lg
                             text-sm text-white placeholder-gray-600 font-mono
                             focus:outline-none focus:border-brand-500/50"
                />
              </div>

              {loading ? (
                <p className="text-gray-500 text-center py-6">Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm">No available students.</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {filtered.map(s => (
                    <label
                      key={s._id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition
                        ${selected.includes(s._id) ? "bg-brand-500/10 border border-brand-500/20" : "hover:bg-surface-2 border border-transparent"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(s._id)}
                        onChange={() => toggleSelect(s._id)}
                        className="accent-brand-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-medium truncate">{s.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono truncate">
                          {s.universityId || s.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selected.length > 0 && (
                <p className="text-xs text-brand-400 font-mono mt-2">
                  {selected.length} student{selected.length > 1 ? "s" : ""} selected
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 font-mono mb-2">
                Paste university IDs, emails, or user IDs — one per line or comma-separated.
              </p>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                rows={8}
                placeholder={"STU001\nSTU002\nstudent@example.com"}
                className="w-full px-3 py-2 bg-surface-2 border border-surface-3 rounded-lg
                           text-sm text-white placeholder-gray-600 font-mono resize-none
                           focus:outline-none focus:border-brand-500/50"
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-2 text-gray-300 border border-surface-3
                       hover:border-gray-600 text-sm font-mono transition"
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-mono
                       hover:bg-brand-600 disabled:opacity-50 transition"
          >
            {saving ? "Enrolling…" : "Enroll"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminEnrollments() {
  const [courses, setCourses]       = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents]     = useState([]);
  const [courseInfo, setCourseInfo]  = useState(null);
  const [loading, setLoading]       = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [search, setSearch]         = useState("");
  const [courseSearch, setCourseSearch]       = useState("");
  const [showEnroll, setShowEnroll] = useState(false);
  const { toast, showToast }        = useToast();

  // ── Fetch courses ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/course/all");
        setCourses(data.courses || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  // ── Fetch enrolled students for selected course ─────────────────────────────
  const fetchStudents = useCallback(async (courseId) => {
    setStudentsLoading(true);
    try {
      const { data } = await api.get(`/enrollment/course/${courseId}/students`);
      setStudents(data.students || []);
      setCourseInfo(data.course || null);
    } catch {
      showToast("Failed to load students", "error");
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  const handleSelectCourse = (course) => {
    setSelectedCourse(course._id);
    setSearch("");
    fetchStudents(course._id);
  };

  // ── Unenroll ────────────────────────────────────────────────────────────────
  const handleUnenroll = async (studentId) => {
    try {
      await api.delete("/enrollment/unenroll", {
        data: { studentId, courseId: selectedCourse },
      });
      showToast("Student removed");
      fetchStudents(selectedCourse);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove student", "error");
    }
  };

  // ── Filter courses ──────────────────────────────────────────────────────────
  const filteredCourses = courses.filter(c => {
    if (!courseSearch) return true;
    const q = courseSearch.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q);
  });

  // ── Filter students ─────────────────────────────────────────────────────────
  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.universityId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg font-mono text-sm
          ${toast.type === "error"
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : "bg-green-500/10 border-green-500/20 text-green-400"}`}>
          {toast.message}
        </div>
      )}

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <GraduationCap className="text-brand-400" size={24} />
          Enrollment Management
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-mono">
          Manage student enrollments across courses
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* ── Left: Course list ── */}
        <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
          <div className="px-4 py-3 border-b border-surface-2">
            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">Select Course</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search courses…"
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-surface-3 rounded-lg
                           text-sm text-white placeholder-gray-600 font-mono
                           focus:outline-none focus:border-brand-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-gray-500 text-center py-8 text-sm">Loading…</p>
            ) : filteredCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">No courses found.</p>
            ) : (
              filteredCourses.map(c => (
                <button
                  key={c._id}
                  onClick={() => handleSelectCourse(c)}
                  className={`w-full text-left px-4 py-3 border-b border-surface-2 transition
                    ${selectedCourse === c._id
                      ? "bg-brand-500/10 border-l-2 border-l-brand-500"
                      : "hover:bg-surface-2"}`}
                >
                  <p className="text-sm font-display font-semibold text-white truncate">{c.name}</p>
                  <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                    {c.code} • {c.department}
                  </p>
                  <p className="text-[11px] font-mono text-gray-600 mt-0.5">
                    {c.enrolledStudents?.length || 0} enrolled
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Student list ── */}
        <div className="bg-surface-1 border border-surface-3 rounded-xl overflow-hidden flex flex-col">
          {!selectedCourse ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen size={40} className="text-gray-700 mb-3" />
              <h3 className="text-lg font-display font-bold text-gray-400">Select a Course</h3>
              <p className="text-sm text-gray-600 mt-1 font-mono">
                Pick a course from the left to manage enrollments.
              </p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="px-5 py-3 border-b border-surface-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-white">
                    {courseInfo?.name || "Students"}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} enrolled
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search students…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9 pr-3 py-2 bg-surface-2 border border-surface-3 rounded-lg
                                 text-sm text-white placeholder-gray-600 font-mono w-48
                                 focus:outline-none focus:border-brand-500/50"
                    />
                  </div>
                  <button
                    onClick={() => setShowEnroll(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-500 text-white
                               text-xs font-mono hover:bg-brand-600 transition"
                  >
                    <Plus size={14} /> Enroll
                  </button>
                </div>
              </div>

              {/* Students table */}
              <div className="flex-1 overflow-y-auto">
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="animate-spin text-brand-400" size={24} />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-16">
                    <Users size={36} className="mx-auto text-gray-700 mb-2" />
                    <p className="text-sm text-gray-500 font-mono">No students enrolled yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b border-surface-2">
                        <th className="px-5 py-2.5">Name</th>
                        <th className="px-3 py-2.5">University ID</th>
                        <th className="px-3 py-2.5">Email</th>
                        <th className="px-3 py-2.5">Enrolled</th>
                        <th className="px-3 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-2">
                      {filteredStudents.map(s => (
                        <tr key={s._id} className="hover:bg-surface-2/50 transition">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20
                                              flex items-center justify-center shrink-0">
                                <span className="text-brand-400 text-xs font-bold font-mono">
                                  {s.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-white font-medium truncate">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-gray-400 font-mono text-xs">{s.universityId || "—"}</td>
                          <td className="px-3 py-3 text-gray-400 font-mono text-xs truncate max-w-[180px]">{s.email}</td>
                          <td className="px-3 py-3 text-gray-500 font-mono text-xs">
                            {s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => handleUnenroll(s._id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition"
                              title="Remove student"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Enroll Modal ── */}
      {showEnroll && selectedCourse && (
        <EnrollModal
          courseId={selectedCourse}
          courseName={courseInfo?.name || ""}
          existingIds={students.map(s => s._id)}
          onClose={() => setShowEnroll(false)}
          onDone={(msg, type) => {
            setShowEnroll(false);
            showToast(msg, type);
            fetchStudents(selectedCourse);
          }}
        />
      )}
    </div>
  );
}
