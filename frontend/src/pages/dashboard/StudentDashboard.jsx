import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import {
  TrendingUp, BookOpen, ClipboardCheck, AlertTriangle,
  QrCode, Calendar, Clock, ChevronRight, CheckCircle2,
  XCircle, MinusCircle, RefreshCw, Zap,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAttendanceColor(pct) {
  if (pct >= 75) return { text: "text-brand-400", bg: "bg-brand-500", track: "bg-brand-500/20" };
  if (pct >= 50) return { text: "text-yellow-400", bg: "bg-yellow-500", track: "bg-yellow-500/20" };
  return { text: "text-red-400", bg: "bg-red-500", track: "bg-red-500/20" };
}

const STATUS_CONFIG = {
  present: { icon: CheckCircle2, color: "text-brand-400",  label: "Present" },
  absent:  { icon: XCircle,      color: "text-red-400",    label: "Absent"  },
  late:    { icon: MinusCircle,  color: "text-yellow-400", label: "Late"    },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, delay }) {
  return (
    <div className="bg-surface-1 border border-surface-2 rounded-xl p-4
                    hover:border-surface-3 transition-all duration-200
                    animate-fade-up flex items-start gap-4"
         style={{ animationDelay: delay }}>
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-xl font-display font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className={`text-xs mt-0.5 ${sub.color}`}>{sub.text}</p>}
      </div>
    </div>
  );
}

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ percent }) {
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color  = getAttendanceColor(percent);
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="128" height="128">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10"
          className="stroke-surface-2" />
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-700 ${
            percent >= 75 ? "stroke-brand-500"
            : percent >= 50 ? "stroke-yellow-500"
            : "stroke-red-500"
          }`} />
      </svg>
      <div className="text-center">
        <p className={`text-2xl font-display font-bold ${color.text}`}>{percent}%</p>
        <p className="text-[10px] font-mono text-gray-500 mt-0.5">Overall</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [courses,        setCourses]        = useState([]);
  const [attendanceMap,  setAttendanceMap]  = useState({});
  const [activeSessions, setActiveSessions] = useState([]);
  const [recentRecords,  setRecentRecords]  = useState([]);
  const [loading,        setLoading]        = useState(true);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const greeting = new Date().getHours() < 12 ? "Good Morning"
    : new Date().getHours() < 17 ? "Good Afternoon" : "Good Evening";

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [enrollRes, sessRes, attRes] = await Promise.all([
        api.get("/enrollment/my-courses"),
        api.get("/session/active"),
        api.get("/attendance/my-attendance?limit=10"),
      ]);

      const enrolled = enrollRes.data.courses   || [];
      const sessions = sessRes.data.sessions    || [];
      const recent   = attRes.data.records      || [];

      setCourses(enrolled);
      setActiveSessions(sessions);
      setRecentRecords(recent.slice(0, 4));

      // Build attendance % per course
      const map = {};
      await Promise.all(
        enrolled.map(async (enroll) => {
          const cid = enroll.courseId?._id || enroll._id;
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
      console.error("StudentDashboard fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll active sessions every 30s
    const iv = setInterval(async () => {
      try {
        const { data } = await api.get("/session/active");
        setActiveSessions(data.sessions || []);
      } catch {}
    }, 30000);
    return () => clearInterval(iv);
  }, [fetchData]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const allPcts       = Object.values(attendanceMap).map(v => v.pct);
  const overallPct    = allPcts.length > 0
    ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : 0;
  const totalPresent  = Object.values(attendanceMap).reduce((a, v) => a + v.present, 0);
  const totalClasses  = Object.values(attendanceMap).reduce((a, v) => a + v.total,   0);
  const lowCount      = allPcts.filter(p => p > 0 && p < 75).length;
  const activeCount   = activeSessions.length;

  // ── Handle Scan QR button ────────────────────────────────────────────────────
  const handleScanQR = () => {
    if (activeSessions.length === 1) {
      // Exactly one active session — go directly to scanner
      navigate(`/dashboard/student/scan/${activeSessions[0]._id}`);
    } else if (activeSessions.length > 1) {
      // Multiple active sessions — go to My Classes to pick one
      navigate("/dashboard/student/classes");
    } else {
      // No active session — go to My Classes
      navigate("/dashboard/student/classes");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">

      {/* ── Welcome Banner ──────────────────────────────────────────────────── */}
      <div className="animate-fade-up bg-gradient-to-r from-brand-500/10 to-transparent
                      border border-brand-500/20 rounded-xl px-6 py-5
                      flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-white">
            {greeting},
            <span className="text-brand-400 ml-2">{user?.name?.split(" ")[0]} 👋</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">{today}</p>
          {user?.department && (
            <p className="text-xs font-mono text-brand-500/70 mt-1">
              {user.department} · {user.universityId}
            </p>
          )}
        </div>

        {/* ── REAL Scan QR button ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10
                            border border-brand-500/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              <span className="text-[11px] font-mono text-brand-400">
                {activeCount} session{activeCount > 1 ? "s" : ""} live
              </span>
            </div>
          )}
          <button
            onClick={handleScanQR}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400
                       text-white text-sm font-display rounded-lg transition-all duration-200
                       active:scale-[0.97] shrink-0 shadow-lg shadow-brand-500/20">
            <QrCode size={16} />
            {activeCount > 0 ? "Scan QR Code" : "My Classes"}
          </button>
        </div>
      </div>

      {/* ── Active Session Alert ─────────────────────────────────────────────── */}
      {activeCount > 0 && !loading && (
        <div className="animate-fade-up flex items-center justify-between gap-3 p-4
                        bg-brand-500/10 border border-brand-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-brand-400 shrink-0" />
            <div>
              <p className="text-sm text-brand-300 font-display font-semibold">
                {activeCount > 1
                  ? `${activeCount} classes have active sessions right now!`
                  : `${activeSessions[0]?.courseId?.name || "A class"} has an active session!`}
              </p>
              <p className="text-xs text-brand-400/70 font-body">
                Scan the QR code shown by your teacher to mark attendance
              </p>
            </div>
          </div>
          <button onClick={handleScanQR}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2
                       bg-brand-500 hover:bg-brand-400 text-white text-xs
                       font-display rounded-lg transition-all active:scale-[0.97]">
            <QrCode size={12} /> Scan Now
          </button>
        </div>
      )}

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp}    label="Overall Attendance" value={loading ? "—" : `${overallPct}%`}
          iconBg="bg-brand-500/10"  iconColor="text-brand-400"  delay="0ms"
          sub={!loading && (overallPct >= 75
            ? { text: "On track ✓",        color: "text-brand-400" }
            : { text: "Needs improvement", color: "text-red-400"   })} />
        <StatCard icon={BookOpen}       label="Enrolled Courses"  value={loading ? "—" : courses.length}
          iconBg="bg-blue-500/10"   iconColor="text-blue-400"   delay="80ms" />
        <StatCard icon={ClipboardCheck} label="Classes Attended"  value={loading ? "—" : totalPresent}
          iconBg="bg-purple-500/10" iconColor="text-purple-400" delay="160ms"
          sub={!loading && { text: `of ${totalClasses} total`, color: "text-gray-500" }} />
        <StatCard icon={AlertTriangle}  label="Low Attendance"    value={loading ? "—" : lowCount}
          iconBg="bg-yellow-500/10" iconColor="text-yellow-400" delay="240ms"
          sub={!loading && (lowCount > 0
            ? { text: "courses below 75%", color: "text-yellow-400" }
            : { text: "All good!",         color: "text-brand-400"  })} />
      </div>

      {/* ── Middle Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Subject-wise Attendance */}
        <div className="lg:col-span-2 bg-surface-1 border border-surface-2
                        rounded-xl p-5 animate-fade-up" style={{ animationDelay: "320ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <ClipboardCheck size={16} className="text-brand-400" />
              Course Attendance
            </h2>
            <button onClick={() => navigate("/dashboard/student/classes")}
              className="text-xs text-brand-400 hover:text-brand-300
                         flex items-center gap-1 transition-colors font-display">
              View all <ChevronRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-8 bg-surface-2 rounded animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <BookOpen size={24} className="text-gray-700" />
              <p className="text-sm text-gray-500 font-body">Not enrolled in any courses yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {courses.slice(0, 5).map((enroll) => {
                const cid   = enroll.courseId?._id || enroll._id;
                const att   = attendanceMap[cid] || { total: 0, present: 0, pct: 0 };
                const color = getAttendanceColor(att.pct);
                const hasActive = activeSessions.some(
                  s => (s.courseId?._id || s.courseId) === cid
                );
                return (
                  <div key={cid}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-600 w-14">
                          {enroll.courseId?.code || "—"}
                        </span>
                        <span className="text-sm text-gray-300 font-body">
                          {enroll.courseId?.name || "Course"}
                        </span>
                        {hasActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{att.present}/{att.total}</span>
                        <span className={`text-sm font-display font-bold w-10 text-right ${color.text}`}>
                          {att.pct}%
                        </span>
                      </div>
                    </div>
                    <div className={`h-1.5 rounded-full ${color.track}`}>
                      <div className={`h-full rounded-full transition-all duration-700 ${color.bg}`}
                           style={{ width: `${att.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overall Circle */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up flex flex-col items-center justify-center gap-4"
             style={{ animationDelay: "400ms" }}>
          <h2 className="font-display font-semibold text-white self-start flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-400" /> Overall
          </h2>
          {loading
            ? <div className="w-32 h-32 rounded-full bg-surface-2 animate-pulse" />
            : <CircularProgress percent={overallPct} />}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500">Present</span>
              <span className="text-white">{totalPresent}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500">Absent</span>
              <span className="text-red-400">{totalClasses - totalPresent}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500">Min Required</span>
              <span className="text-yellow-400">75%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent attendance */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "480ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-brand-400" /> Recent Attendance
            </h2>
            <button onClick={fetchData}
              className="text-gray-500 hover:text-gray-300 transition-colors">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i =>
                <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />)}
            </div>
          ) : recentRecords.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <ClipboardCheck size={24} className="text-gray-700" />
              <p className="text-sm text-gray-500 font-body">No attendance records yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentRecords.map((r, i) => {
                const cfg  = STATUS_CONFIG[r.status] || STATUS_CONFIG.absent;
                const date = new Date(r.markedAt || r.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric",
                });
                return (
                  <div key={i} className="flex items-center justify-between
                                          px-3 py-2.5 rounded-lg bg-surface-2/50
                                          border border-surface-2 hover:border-surface-3
                                          transition-colors">
                    <div className="flex items-center gap-3">
                      <cfg.icon size={15} className={cfg.color} />
                      <div>
                        <p className="text-sm text-gray-200 font-body">
                          {r.sessionId?.courseId?.name || r.courseId?.name || "Course"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{date}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono ${cfg.color}`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active sessions / My Courses quick links */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "560ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Calendar size={16} className="text-brand-400" />
              {activeCount > 0 ? "Active Sessions" : "My Courses"}
            </h2>
            <button onClick={() => navigate("/dashboard/student/classes")}
              className="text-xs text-brand-400 hover:text-brand-300
                         flex items-center gap-1 transition-colors font-display">
              View all <ChevronRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i =>
                <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />)}
            </div>
          ) : activeCount > 0 ? (
            <div className="flex flex-col gap-2">
              {activeSessions.slice(0, 4).map((s, i) => (
                <div key={i}
                  onClick={() => navigate(`/dashboard/student/scan/${s._id}`)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                             bg-brand-500/5 border border-brand-500/20
                             hover:border-brand-500/40 transition-all cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20
                                  flex items-center justify-center shrink-0">
                    <QrCode size={14} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-body truncate">
                      {s.courseId?.name || "Active Session"}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {s.courseId?.code} · Tap to scan
                    </p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {courses.slice(0, 4).map((enroll, i) => (
                <div key={i}
                  onClick={() => navigate("/dashboard/student/classes")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                             bg-surface-2/50 border border-surface-2
                             hover:border-brand-500/30 transition-all cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20
                                  flex items-center justify-center shrink-0">
                    <BookOpen size={14} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-body truncate">
                      {enroll.courseId?.name || "Course"}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {enroll.courseId?.code}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-brand-400
                                                     transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}