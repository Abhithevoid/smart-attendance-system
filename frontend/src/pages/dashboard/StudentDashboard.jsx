import React from "react";
import { useAuth } from "../../context/AuthContext";
import { ClipboardCheck, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";

const stats = [
  { label: "Overall Attendance", value: "—%", icon: TrendingUp,    color: "text-brand-400",  bg: "bg-brand-500/10"  },
  { label: "Classes Enrolled",   value: "—",  icon: BookOpen,      color: "text-blue-400",   bg: "bg-blue-500/10"   },
  { label: "Present This Month", value: "—",  icon: ClipboardCheck,color: "text-purple-400", bg: "bg-purple-500/10" },
  { label: "Low Attendance",     value: "—",  icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10" },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-display font-bold text-white">My Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Hello, <span className="text-brand-400">{user?.name}</span> — here's your attendance summary.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className="stat-card animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card animate-fade-up" style={{ animationDelay: "320ms" }}>
        <h2 className="font-display font-semibold text-white mb-4">Subject-wise Attendance</h2>
        <div className="overflow-x-auto">
          <table className="table-base w-full text-sm">
            <thead>
              <tr className="border-b border-surface-2">
                <th className="py-3 px-4 text-left text-xs font-mono text-gray-500 uppercase">Subject</th>
                <th className="py-3 px-4 text-left text-xs font-mono text-gray-500 uppercase">Total</th>
                <th className="py-3 px-4 text-left text-xs font-mono text-gray-500 uppercase">Present</th>
                <th className="py-3 px-4 text-left text-xs font-mono text-gray-500 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="text-center text-gray-600 font-mono text-xs py-6">
                  No data yet. Enroll in classes to see attendance.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}