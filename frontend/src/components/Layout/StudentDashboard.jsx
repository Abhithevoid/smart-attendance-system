import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  TrendingUp, BookOpen, ClipboardCheck, AlertTriangle,
  QrCode, Calendar, Clock, ChevronRight, CheckCircle2,
  XCircle, MinusCircle,
} from "lucide-react";

// ─── Placeholder Data ─────────────────────────────────────────────────────────
const ATTENDANCE_DATA = [
  { subject: "Data Structures",       total: 30, present: 27, code: "CS201" },
  { subject: "Computer Networks",     total: 28, present: 19, code: "CS301" },
  { subject: "Database Management",   total: 25, present: 24, code: "CS302" },
  { subject: "Operating Systems",     total: 32, present: 20, code: "CS303" },
  { subject: "Software Engineering",  total: 20, present: 20, code: "CS401" },
];

const RECENT_CLASSES = [
  { subject: "Data Structures",      time: "9:00 AM",  room: "Lab 3",   status: "present" },
  { subject: "Computer Networks",    time: "11:00 AM", room: "Room 201",status: "present" },
  { subject: "Database Management",  time: "2:00 PM",  room: "Room 105",status: "absent"  },
  { subject: "Operating Systems",    time: "4:00 PM",  room: "Lab 1",   status: "present" },
];

const UPCOMING = [
  { subject: "Software Engineering", time: "Tomorrow 10:00 AM", room: "Room 302" },
  { subject: "Data Structures",      time: "Tomorrow 9:00 AM",  room: "Lab 3"    },
  { subject: "Computer Networks",    time: "Wed 11:00 AM",      room: "Room 201" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPercent(present, total) {
  return total ? Math.round((present / total) * 100) : 0;
}

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
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = getAttendanceColor(percent);

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
          }`}
        />
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
  const { user } = useAuth();
  const [showQR, setShowQR] = useState(false);

  const totalClasses  = ATTENDANCE_DATA.reduce((a, s) => a + s.total, 0);
  const totalPresent  = ATTENDANCE_DATA.reduce((a, s) => a + s.present, 0);
  const overallPct    = getPercent(totalPresent, totalClasses);
  const lowAttendance = ATTENDANCE_DATA.filter(s => getPercent(s.present, s.total) < 75).length;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">

      {/* ── Welcome Banner ──────────────────────────────────────────────────── */}
      <div className="animate-fade-up bg-gradient-to-r from-brand-500/10 to-transparent
                      border border-brand-500/20 rounded-xl px-6 py-5
                      flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-white">
            Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},
            <span className="text-brand-400 ml-2">{user?.name?.split(" ")[0]} 👋</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">{today}</p>
          {user?.department && (
            <p className="text-xs font-mono text-brand-500/70 mt-1">
              {user.department} · {user.universityId}
            </p>
          )}
        </div>
        {/* Scan QR Button */}
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-400
                     text-white text-sm font-display rounded-lg transition-all duration-200
                     active:scale-[0.97] shrink-0 shadow-lg shadow-brand-500/20"
        >
          <QrCode size={16} />
          Scan QR Code
        </button>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp}    label="Overall Attendance" value={`${overallPct}%`}
          iconBg="bg-brand-500/10"  iconColor="text-brand-400"  delay="0ms"
          sub={overallPct >= 75 ? { text: "On track ✓", color: "text-brand-400" }
                                : { text: "Needs improvement", color: "text-red-400" }} />
        <StatCard icon={BookOpen}      label="Enrolled Subjects"  value={ATTENDANCE_DATA.length}
          iconBg="bg-blue-500/10"   iconColor="text-blue-400"   delay="80ms" />
        <StatCard icon={ClipboardCheck} label="Classes Attended"  value={totalPresent}
          iconBg="bg-purple-500/10" iconColor="text-purple-400" delay="160ms"
          sub={{ text: `of ${totalClasses} total`, color: "text-gray-500" }} />
        <StatCard icon={AlertTriangle} label="Low Attendance"     value={lowAttendance}
          iconBg="bg-yellow-500/10" iconColor="text-yellow-400" delay="240ms"
          sub={lowAttendance > 0 ? { text: "subjects below 75%", color: "text-yellow-400" }
                                 : { text: "All good!", color: "text-brand-400" }} />
      </div>

      {/* ── Middle Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Attendance Summary Card */}
        <div className="lg:col-span-2 bg-surface-1 border border-surface-2
                        rounded-xl p-5 animate-fade-up" style={{ animationDelay: "320ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <ClipboardCheck size={16} className="text-brand-400" />
              Subject-wise Attendance
            </h2>
            <span className="text-xs font-mono text-gray-500">This Semester</span>
          </div>

          <div className="flex flex-col gap-3">
            {ATTENDANCE_DATA.map((s) => {
              const pct   = getPercent(s.present, s.total);
              const color = getAttendanceColor(pct);
              return (
                <div key={s.code}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-600 w-14">{s.code}</span>
                      <span className="text-sm text-gray-300 font-body">{s.subject}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{s.present}/{s.total}</span>
                      <span className={`text-sm font-display font-bold w-10 text-right ${color.text}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className={`h-1.5 rounded-full ${color.track}`}>
                    <div className={`h-full rounded-full transition-all duration-700 ${color.bg}`}
                         style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall % Circle */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up flex flex-col items-center justify-center gap-4"
             style={{ animationDelay: "400ms" }}>
          <h2 className="font-display font-semibold text-white self-start flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-400" />
            Overall
          </h2>
          <CircularProgress percent={overallPct} />
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500">Classes Present</span>
              <span className="text-white">{totalPresent}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500">Classes Absent</span>
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

        {/* Recent Classes */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "480ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-brand-400" />
              Today's Classes
            </h2>
            <span className="text-xs font-mono text-gray-500">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {RECENT_CLASSES.map((cls, i) => {
              const cfg = STATUS_CONFIG[cls.status];
              return (
                <div key={i} className="flex items-center justify-between
                                        px-3 py-2.5 rounded-lg bg-surface-2/50
                                        border border-surface-2 hover:border-surface-3
                                        transition-colors">
                  <div className="flex items-center gap-3">
                    <cfg.icon size={15} className={cfg.color} />
                    <div>
                      <p className="text-sm text-gray-200 font-body">{cls.subject}</p>
                      <p className="text-xs text-gray-500 font-mono">{cls.time} · {cls.room}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-mono ${cfg.color}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "560ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Calendar size={16} className="text-brand-400" />
              Upcoming Classes
            </h2>
            <button className="text-xs text-brand-400 hover:text-brand-300
                               flex items-center gap-1 transition-colors">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {UPCOMING.map((cls, i) => (
              <div key={i} className="flex items-center gap-3
                                      px-3 py-2.5 rounded-lg bg-surface-2/50
                                      border border-surface-2 hover:border-brand-500/30
                                      transition-all duration-150 cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20
                                flex items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-body truncate">{cls.subject}</p>
                  <p className="text-xs text-gray-500 font-mono">{cls.time} · {cls.room}</p>
                </div>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-brand-400
                                                   transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QR Modal (placeholder) ──────────────────────────────────────────── */}
      {showQR && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                        flex items-center justify-center p-4"
             onClick={() => setShowQR(false)}>
          <div className="bg-surface-1 border border-surface-2 rounded-2xl p-6
                          w-full max-w-sm text-center animate-fade-up"
               onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-brand-500/10 border border-brand-500/20
                            rounded-xl flex items-center justify-center mx-auto mb-4">
              <QrCode size={24} className="text-brand-400" />
            </div>
            <h3 className="font-display font-bold text-white text-lg">Scan QR Code</h3>
            <p className="text-gray-500 text-sm mt-2 mb-6 font-body">
              QR code scanner will be available once your teacher generates a session QR code.
            </p>
            <div className="w-48 h-48 mx-auto bg-surface-2 border-2 border-dashed
                            border-surface-3 rounded-xl flex items-center justify-center mb-6">
              <p className="text-xs text-gray-600 font-mono text-center px-4">
                Camera access coming in next update
              </p>
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