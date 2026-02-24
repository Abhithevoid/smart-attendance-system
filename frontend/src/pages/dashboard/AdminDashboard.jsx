import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Users, BookOpen, ClipboardCheck, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const stats = [
  { label: "Total Users",     value: "—", icon: Users,          color: "text-blue-400",   bg: "bg-blue-500/10"   },
  { label: "Active Classes",  value: "—", icon: BookOpen,       color: "text-brand-400",  bg: "bg-brand-500/10"  },
  { label: "Attendance Today",value: "—", icon: ClipboardCheck, color: "text-purple-400", bg: "bg-purple-500/10" },
  { label: "Avg. Attendance", value: "—", icon: TrendingUp,     color: "text-yellow-400", bg: "bg-yellow-500/10" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-display font-bold text-white">Admin Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, <span className="text-brand-400">{user?.name}</span></p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card animate-fade-up" style={{ animationDelay: "320ms" }}>
          <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-brand-400" /> Recent Activity
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { text: "New student registered",       icon: CheckCircle2, color: "text-brand-400"   },
              { text: "Attendance marked for CS101",  icon: CheckCircle2, color: "text-brand-400"   },
              { text: "Low attendance alert",          icon: AlertTriangle,color: "text-yellow-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                <item.icon size={14} className={item.color} />
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="card animate-fade-up" style={{ animationDelay: "400ms" }}>
          <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-400" /> Attendance Overview
          </h2>
          <div className="flex items-center justify-center h-24 text-gray-600 text-sm font-mono">
            Chart coming soon
          </div>
        </div>
      </div>
    </div>
  );
}