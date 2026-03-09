import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import {
  BookOpen, Users, Clock, MapPin, Calendar,
  PlayCircle, ChevronRight, RefreshCw, Search,
  GraduationCap, BarChart2, Layers, AlertCircle,
  CheckCircle2, XCircle, Zap,
} from "lucide-react";
import StartSessionModal from "../../components/StartSessionModal";

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl border
                     shadow-2xl animate-fade-up flex items-center gap-2 text-sm font-body
                     ${toast.type === "error"
                       ? "bg-red-500/10 border-red-500/20 text-red-400"
                       : "bg-brand-500/10 border-brand-500/20 text-brand-400"}`}>
      {toast.type === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
      {toast.message}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                    animate-fade-up hover:border-surface-3 transition-all"
         style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-display font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Tag ─────────────────────────────────────────────────────────────
function ScheduleTag({ day, startTime, endTime, location }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-2
                    border border-surface-3 rounded-lg text-[11px] font-mono text-gray-400">
      <Calendar size={10} className="text-gray-600" />
      {day?.slice(0, 3)} {startTime}–{endTime}
      {location && (
        <>
          <span className="text-gray-700">·</span>
          <MapPin size={9} className="text-gray-600" />
          {location}
        </>
      )}
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, onStartSession, index }) {
  const hasActiveSession = course.activeSession;
  const enrolledCount    = course.enrolledCount || 0;

  return (
    <div className="bg-surface-1 border border-surface-2 rounded-2xl overflow-hidden
                    hover:border-blue-500/30 transition-all duration-300 animate-fade-up
                    group"
         style={{ animationDelay: `${index * 80}ms` }}>

      {/* Top bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-60
                      group-hover:opacity-100 transition-opacity" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10
                               border border-blue-500/20 px-2 py-0.5 rounded-full">
                {course.code}
              </span>
              {course.semester && (
                <span className="text-xs font-mono text-gray-600">
                  Sem {course.semester}
                </span>
              )}
              {course.credits && (
                <span className="text-xs font-mono text-gray-600">
                  · {course.credits} Credits
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-white text-base leading-tight">
              {course.name}
            </h3>
            {course.department && (
              <p className="text-xs text-gray-500 font-body mt-0.5">{course.department}</p>
            )}
          </div>

          {/* Active session badge */}
          {hasActiveSession && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-500/10
                            border border-brand-500/20 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              <span className="text-[10px] font-mono text-brand-400">Live</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-surface-2 rounded-lg p-2.5 text-center border border-surface-3">
            <p className="text-lg font-display font-bold text-white">{enrolledCount}</p>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">Students</p>
          </div>
          <div className="bg-surface-2 rounded-lg p-2.5 text-center border border-surface-3">
            <p className="text-lg font-display font-bold text-white">
              {course.totalSessions || 0}
            </p>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">Sessions</p>
          </div>
          <div className="bg-surface-2 rounded-lg p-2.5 text-center border border-surface-3">
            <p className="text-lg font-display font-bold text-white">
              {course.avgAttendance !== undefined ? `${course.avgAttendance}%` : "—"}
            </p>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">Avg.</p>
          </div>
        </div>

        {/* Schedule */}
        {course.schedule?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {course.schedule.slice(0, 3).map((s, i) => (
              <ScheduleTag key={i} {...s} />
            ))}
            {course.schedule.length > 3 && (
              <span className="text-[10px] font-mono text-gray-600 self-center">
                +{course.schedule.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {course.description && (
          <p className="text-xs text-gray-500 font-body mb-4 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Action button */}
        <button
          onClick={() => onStartSession(course)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                      font-display text-sm font-semibold transition-all duration-200
                      active:scale-[0.97]
                      ${hasActiveSession
                        ? "bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/20"
                        : "bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400"
                      }`}>
          {hasActiveSession ? (
            <><Zap size={15} /> View Active Session</>
          ) : (
            <><PlayCircle size={15} /> Start Session</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center
                    py-20 text-center animate-fade-up">
      <div className="w-16 h-16 bg-surface-2 border border-surface-3 rounded-2xl
                      flex items-center justify-center mb-4">
        <BookOpen size={28} className="text-gray-600" />
      </div>
      <h3 className="text-lg font-display font-bold text-white mb-2">No Courses Assigned</h3>
      <p className="text-sm text-gray-500 font-body max-w-xs">
        You have no courses assigned yet. Contact an administrator to get courses assigned to you.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TeacherCourses() {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [courses,     setCourses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [toast,       setToast]       = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal,   setShowModal]   = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch courses + active sessions ─────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/course/teacher/my-courses");
      const coursesRaw = data.courses || [];

      // Check for active sessions for each course
      const [sessionsRes] = await Promise.all([
        api.get("/session/teacher/today"),
      ]);
      const todaySessions = sessionsRes.data.sessions || [];

      const enriched = coursesRaw.map(course => ({
        ...course,
        activeSession: todaySessions.find(
          s => s.courseId?._id === course._id && s.status === "active"
        ) || null,
      }));

      setCourses(enriched);
    } catch (err) {
      showToast("Failed to load courses", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ── Filtered courses ─────────────────────────────────────────────────────────
  const filtered = courses.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q)
    );
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalStudents   = courses.reduce((a, c) => a + (c.enrolledCount || 0), 0);
  const activeSessions  = courses.filter(c => c.activeSession).length;
  const totalSessions   = courses.reduce((a, c) => a + (c.totalSessions || 0), 0);

  const handleStartSession = (course) => {
    if (course.activeSession) {
      navigate(`/dashboard/teacher/session/${course.activeSession._id}`);
    } else {
      setSelectedCourse(course);
      setShowModal(true);
    }
  };

  const handleSessionCreated = (session) => {
    setShowModal(false);
    showToast("Session started! QR code is ready.");
    navigate(`/dashboard/teacher/session/${session._id}`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <Toast toast={toast} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="animate-fade-up flex flex-col sm:flex-row
                      sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <BookOpen size={22} className="text-blue-400" /> My Courses
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">
            Manage sessions and track attendance for your courses
          </p>
        </div>
        <button onClick={fetchCourses} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-surface-2
                     hover:bg-surface-3 border border-surface-3 rounded-lg
                     text-gray-300 hover:text-white text-sm font-display
                     transition-all active:scale-[0.97] shrink-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}  label="My Courses"      value={courses.length}  color="bg-blue-500"   delay="0ms"   />
        <StatCard icon={Users}     label="Total Students"  value={totalStudents}   color="bg-brand-500"  delay="60ms"  />
        <StatCard icon={Layers}    label="Total Sessions"  value={totalSessions}   color="bg-purple-500" delay="120ms" />
        <StatCard icon={Zap}       label="Active Now"      value={activeSessions}  color="bg-yellow-500" delay="180ms" />
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative animate-fade-up" style={{ animationDelay: "240ms" }}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by course name, code or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-1 border border-surface-2 rounded-xl
                     py-3 pl-9 pr-4 text-sm text-gray-100 placeholder-gray-600
                     focus:outline-none focus:border-blue-500/50
                     focus:ring-1 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {/* ── Course Grid ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className="bg-surface-1 border border-surface-2
                                    rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-surface-2 rounded w-1/3 mb-3" />
              <div className="h-6 bg-surface-2 rounded w-2/3 mb-2" />
              <div className="h-3 bg-surface-2 rounded w-1/2 mb-4" />
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1,2,3].map(j => (
                  <div key={j} className="h-14 bg-surface-2 rounded-lg" />
                ))}
              </div>
              <div className="h-10 bg-surface-2 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? <EmptyState /> : (
            filtered.map((course, i) => (
              <CourseCard
                key={course._id}
                course={course}
                index={i}
                onStartSession={handleStartSession}
              />
            ))
          )}
        </div>
      )}

      {/* ── Start Session Modal ──────────────────────────────────────────────── */}
      {showModal && selectedCourse && (
        <StartSessionModal
          course={selectedCourse}
          onClose={() => { setShowModal(false); setSelectedCourse(null); }}
          onSuccess={handleSessionCreated}
        />
      )}
    </div>
  );
}