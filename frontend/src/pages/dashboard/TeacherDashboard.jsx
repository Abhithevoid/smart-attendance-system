import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import {
  BookOpen, Users, ClipboardCheck, BarChart2,
  QrCode, Clock, Calendar, ChevronRight,
  CheckCircle2, Circle, TrendingUp, Zap,
  RefreshCw, AlertCircle, PlayCircle,
} from "lucide-react";

function getBarColor(pct) {
  if (pct >= 75) return "bg-brand-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}
function getTextColor(pct) {
  if (pct >= 75) return "text-brand-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
}

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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [courses,       setCourses]       = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [stats,         setStats]         = useState({
    totalCourses: 0, totalStudents: 0, activeSessions: 0,
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, sessionsRes] = await Promise.all([
        api.get("/course/teacher/my-courses"),
        api.get("/session/teacher/today"),
      ]);

      const courseList    = coursesRes.data.courses   || [];
      const sessionList   = sessionsRes.data.sessions || [];

      setCourses(courseList);
      setTodaySessions(sessionList);
      setStats({
        totalCourses:   courseList.length,
        totalStudents:  courseList.reduce((a, c) => a + (c.enrolledCount || 0), 0),
        activeSessions: sessionList.filter(s => s.status === "active").length,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Navigate to My Classes page where real StartSessionModal lives
  const handleGoToClasses = () => navigate("/dashboard/teacher/classes");

  // If session exists → go to session page; else → go to classes to start one
  const handleSessionAction = (course) => {
    const existing = todaySessions.find(
      s => (s.courseId?._id || s.courseId) === course._id && s.status === "active"
    );
    if (existing) {
      navigate(`/dashboard/teacher/session/${existing._id}`);
    } else {
      navigate("/dashboard/teacher/classes");
    }
  };

  const avgAttendance = courses.length > 0
    ? Math.round(courses.reduce((a, c) => a + (c.avgAttendance || 0), 0) / courses.length)
    : 0;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">

      {/* ── Welcome Banner ──────────────────────────────────────────────────── */}
      <div className="animate-fade-up bg-gradient-to-r from-blue-500/10 to-transparent
                      border border-blue-500/20 rounded-xl px-6 py-5
                      flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-white">
            Welcome back,
            <span className="text-blue-400 ml-2">{user?.name?.split(" ")[0]} 👋</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">{today}</p>
          {user?.department && (
            <p className="text-xs font-mono text-blue-500/70 mt-1">
              {user.department} · {stats.totalCourses} courses
            </p>
          )}
        </div>
        {/* ── Real button → navigates to My Classes ───────────────────────── */}
        <button
          onClick={handleGoToClasses}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400
                     text-white text-sm font-display rounded-lg transition-all duration-200
                     active:scale-[0.97] shrink-0 shadow-lg shadow-blue-500/20">
          <QrCode size={16} />
          Generate QR Code
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BookOpen}       label="My Classes"      value={loading ? "—" : stats.totalCourses}
          iconBg="bg-brand-500/10"  iconColor="text-brand-400"  delay="0ms" />
        <StatCard icon={Users}          label="Total Students"  value={loading ? "—" : stats.totalStudents}
          iconBg="bg-blue-500/10"   iconColor="text-blue-400"   delay="80ms" />
        <StatCard icon={Zap}            label="Active Sessions" value={loading ? "—" : stats.activeSessions}
          iconBg="bg-yellow-500/10" iconColor="text-yellow-400" delay="160ms"
          sub={stats.activeSessions > 0
            ? { text: "Live now", color: "text-yellow-400" }
            : { text: "None active", color: "text-gray-500" }} />
        <StatCard icon={BarChart2}      label="Avg. Attendance" value={loading ? "—" : `${avgAttendance}%`}
          iconBg="bg-purple-500/10" iconColor="text-purple-400" delay="240ms"
          sub={{ text: "Across all courses", color: "text-gray-500" }} />
      </div>

      {/* ── Middle Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Today's Sessions ────────────────────────────────────────────── */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "320ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-blue-400" />
              Today's Sessions
            </h2>
            <button onClick={fetchData}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 bg-surface-2 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : todaySessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Circle size={28} className="text-gray-700 mb-2" />
              <p className="text-sm text-gray-500 font-body">No sessions today yet</p>
              <button onClick={handleGoToClasses}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300
                           flex items-center gap-1 transition-colors font-display">
                <PlayCircle size={12} /> Start a session
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {todaySessions.map((session, i) => {
                const isActive = session.status === "active";
                return (
                  <div key={i}
                    className="flex items-center justify-between px-3 py-3 rounded-lg
                               bg-surface-2/50 border border-surface-2
                               hover:border-surface-3 transition-colors">
                    <div className="flex items-center gap-3">
                      {isActive
                        ? <span className="w-3.5 h-3.5 rounded-full bg-brand-500
                                           animate-pulse shrink-0" />
                        : <CheckCircle2 size={15} className="text-gray-600 shrink-0" />
                      }
                      <div>
                        <p className="text-sm text-gray-200 font-body">
                          {session.courseId?.name || "Course"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {session.startTime} · {session.location?.name || "—"} · {session.totalStudents || 0} students
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/teacher/session/${session._id}`)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                                  font-display transition-all duration-150
                                  ${isActive
                                    ? "bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20"
                                    : "bg-surface-3 text-gray-400 hover:bg-surface-2"
                                  }`}>
                      <QrCode size={12} />
                      {isActive ? "Live" : "View"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── My Courses ──────────────────────────────────────────────────── */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              My Courses
            </h2>
            <button onClick={handleGoToClasses}
              className="text-xs text-blue-400 hover:text-blue-300
                         flex items-center gap-1 transition-colors font-display">
              View all <ChevronRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen size={28} className="text-gray-700 mb-2" />
              <p className="text-sm text-gray-500 font-body">No courses assigned yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {courses.slice(0, 4).map((course, i) => {
                const hasActive = todaySessions.some(
                  s => (s.courseId?._id || s.courseId) === course._id && s.status === "active"
                );
                return (
                  <div key={i}
                    onClick={() => handleSessionAction(course)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                               bg-surface-2/50 border border-surface-2
                               hover:border-blue-500/30 transition-all cursor-pointer group">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20
                                    flex items-center justify-center shrink-0">
                      <BookOpen size={14} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 font-body truncate">{course.name}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {course.code} · {course.enrolledCount || 0} students
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasActive && (
                        <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                      )}
                      <span className="text-xs font-mono text-gray-600">
                        {course.department?.slice(0,3) || "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Course Attendance Overview ──────────────────────────────────────── */}
      <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                      animate-fade-up" style={{ animationDelay: "480ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            Course Attendance Overview
          </h2>
          <button onClick={handleGoToClasses}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                       bg-blue-500/10 text-blue-400 border border-blue-500/20
                       hover:bg-blue-500/20 transition-colors font-display">
            <PlayCircle size={12} /> Start Session
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-surface-2 rounded animate-pulse" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500 font-body">No courses to display</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-2">
                  {["Course","Code","Students","Attendance","Status"].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-mono
                                           text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((course, i) => {
                  const pct = course.avgAttendance || 0;
                  return (
                    <tr key={i} className="border-b border-surface-2/50
                                           hover:bg-surface-2/30 transition-colors">
                      <td className="py-3 px-4 text-gray-300 font-body">{course.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{course.code}</td>
                      <td className="py-3 px-4 text-gray-300">{course.enrolledCount || 0}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getBarColor(pct)}`}
                                 style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-sm font-display font-bold ${getTextColor(pct)}`}>
                            {pct > 0 ? `${pct}%` : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full border
                          ${course.isActive
                            ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                            : "bg-surface-2 text-gray-500 border-surface-3"
                          }`}>
                          {course.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}