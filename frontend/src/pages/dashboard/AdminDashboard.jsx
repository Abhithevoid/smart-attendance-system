import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Users, BookOpen, ClipboardCheck, TrendingUp,
  UserPlus, Settings, BarChart2, AlertTriangle,
  CheckCircle2, Clock, ChevronRight, Shield,
  GraduationCap, Briefcase, Search, MoreVertical,
} from "lucide-react";

// ─── Placeholder Data ─────────────────────────────────────────────────────────
const STATS = [
  { label: "Total Students",  value: "248", change: "+12 this month", icon: GraduationCap, iconBg: "bg-brand-500/10",  iconColor: "text-brand-400",  changeColor: "text-brand-400"  },
  { label: "Total Teachers",  value: "32",  change: "+2 this month",  icon: Briefcase,     iconBg: "bg-blue-500/10",   iconColor: "text-blue-400",   changeColor: "text-blue-400"   },
  { label: "Active Courses",  value: "18",  change: "4 departments",  icon: BookOpen,      iconBg: "bg-purple-500/10", iconColor: "text-purple-400", changeColor: "text-gray-500"   },
  { label: "Today's Rate",    value: "84%", change: "+3% vs yesterday",icon: TrendingUp,   iconBg: "bg-yellow-500/10", iconColor: "text-yellow-400", changeColor: "text-brand-400"  },
];

const RECENT_USERS = [
  { name: "Rahul Sharma",    email: "rahul@uni.edu",   role: "student", dept: "Computer Science",    status: "active",   joined: "2 days ago"  },
  { name: "Priya Singh",     email: "priya@uni.edu",   role: "teacher", dept: "Mathematics",         status: "active",   joined: "3 days ago"  },
  { name: "Amit Kumar",      email: "amit@uni.edu",    role: "student", dept: "Electrical Engg.",    status: "active",   joined: "5 days ago"  },
  { name: "Sneha Patel",     email: "sneha@uni.edu",   role: "student", dept: "Civil Engineering",   status: "inactive", joined: "1 week ago"  },
  { name: "Vikram Reddy",    email: "vikram@uni.edu",  role: "teacher", dept: "Physics",             status: "active",   joined: "1 week ago"  },
  { name: "Meera Joshi",     email: "meera@uni.edu",   role: "student", dept: "Computer Science",    status: "active",   joined: "2 weeks ago" },
];

const QUICK_LINKS = [
  { label: "Manage Users",     icon: Users,      color: "text-brand-400",  bg: "bg-brand-500/10",  border: "border-brand-500/20",  desc: "Add, edit, remove users"    },
  { label: "Manage Courses",   icon: BookOpen,   color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   desc: "Create and manage courses"  },
  { label: "Attendance Logs",  icon: ClipboardCheck, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", desc: "View all attendance records"},
  { label: "Reports",          icon: BarChart2,  color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", desc: "Generate system reports"    },
  { label: "System Settings",  icon: Settings,   color: "text-gray-400",   bg: "bg-surface-2",     border: "border-surface-3",     desc: "Configure system settings"  },
  { label: "Role Management",  icon: Shield,     color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    desc: "Manage roles & permissions" },
];

const RECENT_ACTIVITY = [
  { text: "New student registered",          sub: "Rahul Sharma · 2 hours ago",    icon: UserPlus,      color: "text-brand-400"  },
  { text: "Attendance marked for CS201",     sub: "Prof. Priya · 3 hours ago",     icon: CheckCircle2,  color: "text-brand-400"  },
  { text: "Low attendance alert triggered",  sub: "CS301 · 74% average",           icon: AlertTriangle, color: "text-yellow-400" },
  { text: "New course created",              sub: "Advanced ML · 5 hours ago",     icon: BookOpen,      color: "text-blue-400"   },
  { text: "Teacher account approved",        sub: "Vikram Reddy · Yesterday",      icon: CheckCircle2,  color: "text-brand-400"  },
];

const ROLE_BADGE = {
  admin:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
  teacher: "bg-blue-500/10   text-blue-400   border-blue-500/20",
  student: "bg-brand-500/10  text-brand-400  border-brand-500/20",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ stat, delay }) {
  return (
    <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                    hover:border-surface-3 transition-all duration-200
                    animate-fade-up"
         style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
            {stat.label}
          </p>
          <p className="text-3xl font-display font-bold text-white mt-2">
            {stat.value}
          </p>
          <p className={`text-xs mt-1 font-body ${stat.changeColor}`}>
            {stat.change}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
          <stat.icon size={20} className={stat.iconColor} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = RECENT_USERS.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* ── Welcome Banner ──────────────────────────────────────────────────── */}
      <div className="animate-fade-up bg-gradient-to-r from-purple-500/10 to-transparent
                      border border-purple-500/20 rounded-xl px-6 py-5
                      flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-white">
            Admin Control Panel
            <span className="text-purple-400 ml-2">👑</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">
            Welcome back, <span className="text-white">{user?.name}</span> · {today}
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-400
                           text-white text-sm font-display rounded-lg transition-all duration-200
                           active:scale-[0.97] shrink-0 shadow-lg shadow-purple-500/20">
          <UserPlus size={16} />
          Add New User
        </button>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} delay={`${i * 80}ms`} />
        ))}
      </div>

      {/* ── Quick Links ─────────────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{ animationDelay: "320ms" }}>
        <h2 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
          <Settings size={16} className="text-purple-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map((link) => (
            <button key={link.label}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl
                          border ${link.border} ${link.bg}
                          hover:scale-[1.02] transition-all duration-150
                          text-center cursor-pointer`}
            >
              <div className={`w-9 h-9 rounded-lg ${link.bg} flex items-center justify-center`}>
                <link.icon size={18} className={link.color} />
              </div>
              <p className={`text-xs font-display font-semibold ${link.color}`}>{link.label}</p>
              <p className="text-[10px] text-gray-600 font-body leading-tight">{link.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* User Management Table */}
        <div className="lg:col-span-2 bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Users size={16} className="text-purple-400" />
              Recent Users
            </h2>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface-2 border border-surface-3 rounded-lg
                           pl-8 pr-4 py-2 text-xs text-gray-300 placeholder-gray-600
                           focus:outline-none focus:border-purple-500/50
                           transition-colors w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-2">
                  {["Name", "Role", "Department", "Status", "Joined", ""].map(h => (
                    <th key={h} className="py-3 px-3 text-left text-xs font-mono
                                          text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={i} className="border-b border-surface-2/50
                                         hover:bg-surface-2/30 transition-colors">
                    <td className="py-3 px-3">
                      <div>
                        <p className="text-gray-200 font-body text-sm">{u.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-mono px-2 py-1 rounded-full border
                                        ${ROLE_BADGE[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500 font-body">{u.dept}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-mono px-2 py-1 rounded-full border
                        ${u.status === "active"
                          ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                          : "bg-surface-2 text-gray-500 border-surface-3"
                        }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500 font-mono">{u.joined}</td>
                    <td className="py-3 px-3">
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center
                                         text-gray-500 hover:text-white hover:bg-surface-2
                                         transition-colors">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-600 text-xs font-mono">
                      No users found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-2">
            <p className="text-xs text-gray-500 font-mono">
              Showing {filteredUsers.length} of {RECENT_USERS.length} users
            </p>
            <button className="text-xs text-purple-400 hover:text-purple-300
                               flex items-center gap-1 transition-colors font-display">
              View all users <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-1 border border-surface-2 rounded-xl p-5
                        animate-fade-up" style={{ animationDelay: "480ms" }}>
          <h2 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-purple-400" />
            Recent Activity
          </h2>

          <div className="flex flex-col gap-1">
            {RECENT_ACTIVITY.map((item, i) => (
              <div key={i}
                className="flex items-start gap-3 p-3 rounded-lg
                           hover:bg-surface-2/50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-surface-2 flex items-center
                                justify-center shrink-0 mt-0.5">
                  <item.icon size={13} className={item.color} />
                </div>
                <div>
                  <p className="text-sm text-gray-300 font-body leading-tight">{item.text}</p>
                  <p className="text-xs text-gray-600 font-mono mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-3 py-2.5 text-xs text-gray-500 hover:text-white
                             border border-surface-2 hover:border-surface-3 rounded-lg
                             font-display transition-colors flex items-center justify-center gap-1">
            View all activity <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}