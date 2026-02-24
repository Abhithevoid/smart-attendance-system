import React from "react";
import { useAuth } from "../../context/AuthContext";
import { BookOpen, Users, ClipboardCheck, BarChart2 } from "lucide-react";

const stats = [
  { label: "My Classes",      value: "—", icon: BookOpen,       color: "text-brand-400",  bg: "bg-brand-500/10"  },
  { label: "Total Students",  value: "—", icon: Users,          color: "text-blue-400",   bg: "bg-blue-500/10"   },
  { label: "Sessions Today",  value: "—", icon: ClipboardCheck, color: "text-purple-400", bg: "bg-purple-500/10" },
  { label: "Avg. Attendance", value: "—", icon: BarChart2,      color: "text-yellow-400", bg: "bg-yellow-500/10" },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-display font-bold text-white">Teacher Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Good to see you, <span className="text-brand-400">{user?.name}</span></p>
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
        <h2 className="font-display font-semibold text-white mb-4">Today's Classes</h2>
        <div className="flex items-center justify-center h-20 text-gray-600 text-sm font-mono">
          No classes scheduled yet
        </div>
      </div>
    </div>
  );
}