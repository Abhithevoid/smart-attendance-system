import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import {
  BookOpen, Zap, BarChart2, Search,
  RefreshCw, AlertCircle, CheckCircle2,
  Clock, QrCode, GraduationCap,
} from "lucide-react";

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl border
                     shadow-2xl animate-fade-up flex items-center gap-2 text-sm
                     ${toast.type === "error"
                       ? "bg-red-500/10 border-red-500/20 text-red-400"
                       : "bg-brand-500/10 border-brand-500/20 text-brand-400"}`}>
      {toast.type === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
      {toast.message}
    </div>
  );
}

// ─── Attendance ring ──────────────────────────────────────────────────────────
function AttendanceRing({ pct = 0, size = 56 }) {
  const r      = (size - 8) / 2;
  const circ   = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color  = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ffffff08" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
              strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.8s ease" }} />
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <div className="bg-surface-1 border border-surface-2 rounded-xl p-4
                    animate-fade-up hover:border-surface-3 transition-all"
         style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{label}</p>
        <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={13} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-display font-bold text-white">{value}</p>
      {sub && <p className="text-[10px] text-gray-600 font-body mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Course card ──────────────────────────────────────────────────────────────
function CourseCard({ course, attendance, activeSession, index, onScan }) {
  const pct      = attendance?.pct ?? 0;
  const present  = attendance?.present ?? 0;
  const total    = attendance?.total ?? 0;
  const isLow    = total > 0 && pct < 75;
  const isActive = !!activeSession;

  return (
    <div className={`bg-surface-1 border rounded-2xl overflow-hidden
                     transition-all duration-300 animate-fade-up group
                     ${isActive
                       ? "border-brand-500/40 shadow-lg shadow-brand-500/10"
                       : "border-surface-2 hover:border-blue-500/30"}`}
         style={{ animationDelay: `${index * 70}ms` }}>
      <div className={`h-1 transition-all
                       ${isActive
                         ? "bg-gradient-to-r from-brand-500 to-brand-400"
                         : "bg-gradient-to-r from-blue-600 to-blue-500 opacity-50 group-hover:opacity-100"}`} />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative shrink-0">
            <AttendanceRing pct={pct} size={56} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-mono font-bold text-white">{pct}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10
                               border border-blue-500/20 px-2 py-0.5 rounded-full">
                {course.code}
              </span>
              {isActive && (
                <span className="flex items-center gap-1 text-[10px] font-mono
                                 text-brand-400 bg-brand-500/10
                                 border border-brand-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  Live
                </span>
              )}
              {isLow && (
                <span className="text-[10px] font-mono text-red-400 bg-red-500/10
                                 border border-red-500/20 px-2 py-0.5 rounded-full">
                  Low
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-white text-sm leading-tight">
              {course.name}
            </h3>
            <p className="text-[11px] text-gray-500 font-body mt-0.5">
              {course.department}
              {course.credits ? ` · ${course.credits} Credits` : ""}
            </p>
          </div>
        </div>

        {/* Attendance bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-1.5">
            <span>Attendance</span>
            <span>{present}/{total} sessions</span>
          </div>
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000
                             ${pct >= 75 ? "bg-green-500"
                               : pct >= 50 ? "bg-yellow-500"
                               : pct > 0  ? "bg-red-500"
                               : "bg-gray-700"}`}
                 style={{ width: `${pct}%` }} />
          </div>
          {isLow && (
            <p className="text-[10px] text-red-400 font-body mt-1">
              ⚠ Below 75% — attendance at risk
            </p>
          )}
        </div>

        {/* Teacher */}
        {course.teacherId?.name && (
          <div className="flex items-center gap-1.5 mb-4">
            <GraduationCap size={11} className="text-gray-600" />
            <span className="text-[11px] text-gray-500 font-body">
              {course.teacherId.name}
            </span>
          </div>
        )}

        {/* Action */}
        {isActive ? (
          <button onClick={() => onScan(activeSession)}
            className="w-full flex items-center justify-center gap-2 py-2.5
                       bg-brand-500 hover:bg-brand-400 text-white text-sm
                       font-display font-semibold rounded-xl transition-all
                       shadow-lg shadow-brand-500/20 active:scale-[0.97]">
            <QrCode size={15} />
            Scan QR — Mark Attendance
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-2.5
                          bg-surface-2 border border-surface-3 rounded-xl
                          text-gray-600 text-xs font-mono cursor-default">
            <Clock size={12} />
            No active session
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ search }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center
                    py-20 text-center animate-fade-up">
      <div className="w-16 h-16 bg-surface-2 border border-surface-3 rounded-2xl
                      flex items-center justify-center mb-4">
        <BookOpen size={28} className="text-gray-600" />
      </div>
      <h3 className="text-lg font-display font-bold text-white mb-2">
        {search ? "No Courses Found" : "No Enrolled Courses"}
      </h3>
      <p className="text-sm text-gray-500 font-body max-w-xs">
        {search
          ? "Try a different search term."
          : "You are not enrolled in any courses yet. Contact your administrator."}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StudentCourses() {
  const navigate = useNavigate();

  const [courses,        setCourses]        = useState([]);
  const [attendanceMap,  setAttendanceMap]  = useState({});
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [toast,          setToast]          = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // ── Enrolled courses ───────────────────────────────────────────────────
      // API returns: { courses: [ { _id, name, code, department, teacherId, ... } ] }
      // Note: controller spreads courseId fields to top level, so no nesting
      const { data: enrollData } = await api.get("/enrollment/my-courses");
      const enrolled = enrollData.courses || [];
      setCourses(enrolled);

      // ── Active sessions ────────────────────────────────────────────────────
      try {
        const { data: sessData } = await api.get("/session/active");
        setActiveSessions(sessData.sessions || []);
      } catch {
        setActiveSessions([]);
      }

      // ── Attendance per course ──────────────────────────────────────────────
      const map = {};
      await Promise.all(
        enrolled.map(async (course) => {
          const cid = course._id;
          try {
            const { data } = await api.get(`/attendance/my-attendance?courseId=${cid}&limit=200`);
            const recs    = data.records || [];
            const total   = recs.length;
            const present = recs.filter(r => ["present","late"].includes(r.status)).length;
            map[cid] = { total, present, pct: total > 0 ? Math.round((present/total)*100) : 0 };
          } catch {
            map[cid] = { total: 0, present: 0, pct: 0 };
          }
        })
      );
      setAttendanceMap(map);
    } catch (err) {
      console.error("StudentCourses fetchData error:", err.response?.data || err.message);
      showToast("Failed to load courses", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(async () => {
      try {
        const { data } = await api.get("/session/active");
        setActiveSessions(data.sessions || []);
      } catch {}
    }, 30000);
    return () => clearInterval(iv);
  }, [fetchData]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const allPcts    = Object.values(attendanceMap).map(v => v.pct);
  const avgAtt     = allPcts.length
    ? Math.round(allPcts.reduce((a,b) => a+b, 0) / allPcts.length) : 0;
  const activeCount = courses.filter(c =>
    activeSessions.some(s => (s.courseId?._id || s.courseId) === c._id)
  ).length;
  const atRiskCount = allPcts.filter(p => p > 0 && p < 75).length;

  // ── Active session lookup per course ────────────────────────────────────────
  const getActiveSession = (course) =>
    activeSessions.find(s => (s.courseId?._id || s.courseId) === course._id) || null;

  // ── Filter + sort (active first) ────────────────────────────────────────────
  const filtered = courses
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (c.name       || "").toLowerCase().includes(q) ||
        (c.code       || "").toLowerCase().includes(q) ||
        (c.department || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => !!getActiveSession(b) - !!getActiveSession(a));

  const handleScan = (session) => {
    navigate(`/dashboard/student/scan/${session._id}`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <Toast toast={toast} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="animate-fade-up flex flex-col sm:flex-row
                      sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white
                         flex items-center gap-2">
            <BookOpen size={22} className="text-blue-400" /> My Courses
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">
            Track attendance and scan QR codes for active sessions
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
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
        <StatCard icon={BookOpen}    label="Enrolled"        value={courses.length}   color="bg-blue-500"    delay="0ms"   />
        <StatCard icon={BarChart2}   label="Avg. Attendance" value={`${avgAtt}%`}     color="bg-brand-500"   delay="60ms"  />
        <StatCard icon={Zap}         label="Active Now"      value={activeCount}      color="bg-yellow-500"  delay="120ms" />
        <StatCard icon={AlertCircle} label="At Risk"         value={atRiskCount}
          sub={atRiskCount > 0 ? "Below 75%" : "All good!"}  color="bg-red-500"      delay="180ms" />
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative animate-fade-up" style={{ animationDelay: "240ms" }}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-gray-500 pointer-events-none" />
        <input type="text" placeholder="Search by name, code or department..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface-1 border border-surface-2 rounded-xl
                     py-3 pl-9 pr-4 text-sm text-gray-100 placeholder-gray-600
                     focus:outline-none focus:border-blue-500/50
                     focus:ring-1 focus:ring-blue-500/20 transition-all" />
      </div>

      {/* ── Active session banner ────────────────────────────────────────────── */}
      {activeCount > 0 && !loading && (
        <div className="animate-fade-up flex items-center gap-3 p-4
                        bg-brand-500/10 border border-brand-500/20 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse shrink-0" />
          <p className="text-sm text-brand-300 font-body">
            <span className="font-display font-semibold">
              {activeCount} active session{activeCount > 1 ? "s" : ""}
            </span>
            {" "}— Tap the course card to scan QR and mark your attendance
          </p>
        </div>
      )}

      {/* ── Course grid ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className="bg-surface-1 border border-surface-2
                                    rounded-2xl p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-surface-2 shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-surface-2 rounded w-1/3 mb-2" />
                  <div className="h-5 bg-surface-2 rounded w-2/3 mb-1" />
                  <div className="h-3 bg-surface-2 rounded w-1/2" />
                </div>
              </div>
              <div className="h-1.5 bg-surface-2 rounded-full mb-4" />
              <div className="h-10 bg-surface-2 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0
            ? <EmptyState search={search} />
            : filtered.map((course, i) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  attendance={attendanceMap[course._id]}
                  activeSession={getActiveSession(course)}
                  index={i}
                  onScan={handleScan}
                />
              ))}
        </div>
      )}
    </div>
  );
}