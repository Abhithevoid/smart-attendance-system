import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen, Users, ClipboardCheck, BarChart2,
  QrCode, Clock, Calendar, ChevronRight,
  CheckCircle2, Circle, TrendingUp, Plus,
} from "lucide-react";

// ─── Placeholder Data ─────────────────────────────────────────────────────────
const TODAY_CLASSES = [
  { subject: "Data Structures",     code: "CS201", room: "Lab 3",    time: "9:00 AM",   students: 45, marked: true  },
  { subject: "Computer Networks",   code: "CS301", room: "Room 201", time: "11:00 AM",  students: 38, marked: true  },
  { subject: "Database Management", code: "CS302", room: "Room 105", time: "2:00 PM",   students: 42, marked: false },
  { subject: "Operating Systems",   code: "CS303", room: "Lab 1",    time: "4:00 PM",   students: 40, marked: false },
];

const UPCOMING_SESSIONS = [
  { subject: "Software Engineering", code: "CS401", day: "Tomorrow",  time: "10:00 AM", room: "Room 302" },
  { subject: "Data Structures",      code: "CS201", day: "Tomorrow",  time: "9:00 AM",  room: "Lab 3"   },
  { subject: "Computer Networks",    code: "CS301", day: "Wednesday", time: "11:00 AM", room: "Room 201"},
  { subject: "Database Management",  code: "CS302", day: "Thursday",  time: "2:00 PM",  room: "Room 105"},
];

const CLASS_STATS = [
  { subject: "Data Structures",     code: "CS201", students: 45, avgAttendance: 88 },
  { subject: "Computer Networks",   code: "CS301", students: 38, avgAttendance: 71 },
  { subject: "Database Management", code: "CS302", students: 42, avgAttendance: 93 },
  { subject: "Operating Systems",   code: "CS303", students: 40, avgAttendance: 65 },
];

function getAttendanceColor(pct) {
  if (pct >= 75) return "text-brand-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getBarColor(pct) {
  if (pct >= 75) return "bg-brand-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
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
  const { user } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const markedCount   = TODAY_CLASSES.filter(c => c.marked).length;
  const totalStudents = CLASS_STATS.reduce((a, c) => a + c.students, 0);
  const avgAttendance = Math.round(
    CLASS_STATS.reduce((a, c) => a + c.avgAttendance, 0) / CLASS_STATS.length
  );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const handleGenerateQR = (cls) => {
    setSelectedClass(cls);
    setShowQR(true);
  };

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
              {user.department} · {TODAY_CLASSES.length} classes today
            </p>
          )}
        </div>
        {/* Generate QR Button */}
        <button
          onClick={() => handleGenerateQR(TODAY_CLASSES[0])}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400
                     text-white text-sm font-display rounded-lg transition-all duration-200
                     active:scale-[0.97] shrink-0 shadow-lg shadow-blue-500/20"
        >
          <QrCode size={16} />
          Generate QR Code
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BookOpen}       label="My Classes"        value={CLASS_STATS.length}
          iconBg="bg-brand-500/10"  iconColor="text-brand-400"  delay="0ms" />
        <StatCard icon={Users}          label="Total Students"    value={totalStudents}
          iconBg="bg-blue-500/10"   iconColor="text-blue-400"   delay="80ms" />
        <StatCard icon={ClipboardCheck} label="Marked Today"      value={`${markedCount}/${TODAY_CLASSES.length}`}
          iconBg="bg-purple-500/10" iconColor="text-purple-400" delay="160ms"
          sub={markedCount === TODAY_CLASSES.length
            ? { text: "All done ✓", color: "text-brand-400" }
            : { text: `${TODAY_CLASSES.length - markedCount} pending`, color: "text-yellow-400" }} />
        <StatCard icon={BarChart2}      label="Avg. Attendance"   value={`${avgAttendance}%`}
          iconBg="bg-yellow-500/10" iconColor="text-yellow-400" delay="240ms"
          sub={{ text: "Across all classes", color: "text-gray-500" }} />
      </div>

      {/* ── Middle Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Today's Classes */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "320ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-blue-400" />
              Today's Classes
            </h2>
            <span className="text-xs font-mono text-gray-500">
              {markedCount}/{TODAY_CLASSES.length} marked
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {TODAY_CLASSES.map((cls, i) => (
              <div key={i}
                className="flex items-center justify-between px-3 py-3 rounded-lg
                           bg-surface-2/50 border border-surface-2
                           hover:border-surface-3 transition-colors">
                <div className="flex items-center gap-3">
                  {cls.marked
                    ? <CheckCircle2 size={15} className="text-brand-400 shrink-0" />
                    : <Circle       size={15} className="text-gray-600 shrink-0"  />
                  }
                  <div>
                    <p className="text-sm text-gray-200 font-body">{cls.subject}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {cls.time} · {cls.room} · {cls.students} students
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleGenerateQR(cls)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                              font-display transition-all duration-150
                              ${cls.marked
                                ? "bg-surface-3 text-gray-400 hover:bg-surface-2"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                              }`}
                >
                  <QrCode size={12} />
                  {cls.marked ? "Re-open" : "QR"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              Upcoming Sessions
            </h2>
            <button className="text-xs text-blue-400 hover:text-blue-300
                               flex items-center gap-1 transition-colors">
              View all <ChevronRight size={12} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {UPCOMING_SESSIONS.map((s, i) => (
              <div key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                           bg-surface-2/50 border border-surface-2
                           hover:border-blue-500/30 transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20
                                flex items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-body truncate">{s.subject}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {s.day} {s.time} · {s.room}
                  </p>
                </div>
                <span className="text-xs font-mono text-gray-600 shrink-0">{s.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Class Performance ───────────────────────────────────────────────── */}
      <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                      animate-fade-up" style={{ animationDelay: "480ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            Class Attendance Overview
          </h2>
          <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                             bg-blue-500/10 text-blue-400 border border-blue-500/20
                             hover:bg-blue-500/20 transition-colors font-display">
            <Plus size={12} /> New Class
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-2">
                <th className="py-3 px-4 text-left text-xs font-mono text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="py-3 px-4 text-left text-xs font-mono text-gray-500 uppercase tracking-wider">Code</th>
                <th className="py-3 px-4 text-left text-xs font-mono text-gray-500 uppercase tracking-wider">Students</th>
                <th className="py-3 px-4 text-left text-xs font-mono text-gray-500 uppercase tracking-wider">Avg. Attendance</th>
                <th className="py-3 px-4 text-left text-xs font-mono text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {CLASS_STATS.map((cls, i) => (
                <tr key={i} className="border-b border-surface-2/50 hover:bg-surface-2/30 transition-colors">
                  <td className="py-3 px-4 text-gray-300 font-body">{cls.subject}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{cls.code}</td>
                  <td className="py-3 px-4 text-gray-300">{cls.students}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getBarColor(cls.avgAttendance)}`}
                             style={{ width: `${cls.avgAttendance}%` }} />
                      </div>
                      <span className={`text-sm font-display font-bold ${getAttendanceColor(cls.avgAttendance)}`}>
                        {cls.avgAttendance}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-mono px-2 py-1 rounded-full border
                      ${cls.avgAttendance >= 75
                        ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                      {cls.avgAttendance >= 75 ? "Good" : "Needs Attention"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── QR Modal ────────────────────────────────────────────────────────── */}
      {showQR && selectedClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                        flex items-center justify-center p-4"
             onClick={() => setShowQR(false)}>
          <div className="bg-surface-1 border border-surface-2 rounded-2xl p-6
                          w-full max-w-sm animate-fade-up"
               onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20
                              rounded-xl flex items-center justify-center mx-auto mb-3">
                <QrCode size={24} className="text-blue-400" />
              </div>
              <h3 className="font-display font-bold text-white text-lg">Generate QR Code</h3>
              <p className="text-gray-500 text-sm mt-1 font-body">
                {selectedClass.subject} · {selectedClass.time}
              </p>
            </div>

            <div className="w-48 h-48 mx-auto bg-surface-2 border-2 border-dashed
                            border-surface-3 rounded-xl flex items-center justify-center mb-5">
              <p className="text-xs text-gray-600 font-mono text-center px-4">
                QR generation coming in next update
              </p>
            </div>

            <div className="bg-surface-2 rounded-lg px-4 py-3 mb-4 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">Class</span>
                <span className="text-white">{selectedClass.code}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">Room</span>
                <span className="text-white">{selectedClass.room}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-500">Students</span>
                <span className="text-white">{selectedClass.students}</span>
              </div>
            </div>

            <button onClick={() => setShowQR(false)}
              className="w-full py-3 bg-surface-2 hover:bg-surface-3 border border-surface-3
                         text-gray-300 rounded-lg font-display text-sm transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}