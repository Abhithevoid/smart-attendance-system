import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity, Search, RefreshCw, X, Clock, Users, MapPin,
  AlertTriangle, Eye, StopCircle, ChevronDown, CheckCircle2,
  XCircle, Timer, Radio, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";
import api from "../utils/api";

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, showToast: show };
}

// ─── Status badges ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  active:    "bg-green-500/10 text-green-400 border-green-500/20",
  expired:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_ICONS = {
  active:    Radio,
  expired:   Timer,
  completed: CheckCircle2,
  cancelled: XCircle,
};

// ─── Attendance Detail Modal ──────────────────────────────────────────────────
function AttendanceModal({ session, onClose }) {
  const [records, setRecords]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/attendance/session/${session._id}`);
        setRecords(data.records || []);
        setSummary(data.summary || null);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [session._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-1 border border-surface-3 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div>
            <h3 className="font-display font-bold text-white">
              Attendance — {session.courseId?.name || "Session"}
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {new Date(session.date).toLocaleDateString()} • {session.startTime}
              {session.endTime ? ` – ${session.endTime}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-gray-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-4 gap-3 px-6 py-3 border-b border-surface-2">
            {[
              { label: "Present",    val: summary.present,    color: "text-green-400" },
              { label: "Late",       val: summary.late,       color: "text-yellow-400" },
              { label: "Suspicious", val: summary.suspicious, color: "text-red-400" },
              { label: "Rate",       val: `${summary.percentage}%`, color: "text-brand-400" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold font-mono ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Records */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading…</p>
          ) : records.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No attendance records yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-gray-500 uppercase tracking-wider border-b border-surface-2">
                  <th className="pb-2 pr-2">Student</th>
                  <th className="pb-2 pr-2">ID</th>
                  <th className="pb-2 pr-2">Status</th>
                  <th className="pb-2 pr-2">Time</th>
                  <th className="pb-2">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {records.map(r => (
                  <tr key={r._id} className={r.isSuspicious ? "bg-red-500/5" : ""}>
                    <td className="py-2 pr-2 text-white font-medium">{r.studentId?.name || "—"}</td>
                    <td className="py-2 pr-2 text-gray-400 font-mono text-xs">{r.studentId?.universityId || "—"}</td>
                    <td className="py-2 pr-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono border ${
                        r.status === "present" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        r.status === "late"    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                                                 "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-gray-400 font-mono text-xs">
                      {new Date(r.markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2">
                      {r.isSuspicious && (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                          <AlertTriangle size={12} /> Flagged
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminSessions() {
  const [sessions, setSessions]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selected, setSelected]     = useState(null);     // session for attendance modal
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast, showToast }        = useToast();
  const intervalRef                 = useRef(null);

  // ── Fetch sessions ──────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      if (statusFilter === "active") {
        const { data } = await api.get("/session/active");
        setSessions(data.sessions || []);
      } else {
        // For non-active, fetch from teacher/today or course sessions
        // We'll use today's sessions endpoint (admin sees all)
        const { data } = await api.get("/session/teacher/today");
        const filtered = statusFilter === "all"
          ? data.sessions
          : (data.sessions || []).filter(s => s.status === statusFilter);
        setSessions(filtered || []);
      }
    } catch {
      showToast("Failed to load sessions", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ── Auto-refresh for active sessions ────────────────────────────────────────
  useEffect(() => {
    if (autoRefresh && statusFilter === "active") {
      intervalRef.current = setInterval(fetchSessions, 15000);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, statusFilter, fetchSessions]);

  // ── End session ─────────────────────────────────────────────────────────────
  const handleEnd = async (id) => {
    try {
      await api.patch(`/session/${id}/end`);
      showToast("Session ended");
      fetchSessions();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to end session", "error");
    }
  };

  // ── Cancel session ──────────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    try {
      await api.delete(`/session/${id}`);
      showToast("Session cancelled");
      fetchSessions();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to cancel session", "error");
    }
  };

  // ── Filter by search ───────────────────────────────────────────────────────
  const filtered = sessions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.courseId?.name?.toLowerCase().includes(q) ||
      s.courseId?.code?.toLowerCase().includes(q) ||
      s.teacherId?.name?.toLowerCase().includes(q)
    );
  });

  // ── Time remaining display ──────────────────────────────────────────────────
  const formatTimer = (seconds) => {
    if (!seconds || seconds <= 0) return "Expired";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg font-mono text-sm
          ${toast.type === "error"
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : "bg-green-500/10 border-green-500/20 text-green-400"}`}>
          {toast.message}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Activity className="text-brand-400" size={24} />
            Sessions Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">
            {filtered.length} session{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono border transition
              ${autoRefresh
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-surface-2 text-gray-400 border-surface-3 hover:border-gray-600"}`}
          >
            <Radio size={14} className={autoRefresh ? "animate-pulse" : ""} />
            {autoRefresh ? "Live" : "Paused"}
          </button>

          <button
            onClick={() => { setLoading(true); fetchSessions(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 text-gray-300
                       border border-surface-3 hover:border-gray-600 text-xs font-mono transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by course, code, or teacher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-surface-3 rounded-lg
                       text-sm text-white placeholder-gray-600 font-mono
                       focus:outline-none focus:border-brand-500/50"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setLoading(true); }}
            className="pl-9 pr-8 py-2.5 bg-surface-1 border border-surface-3 rounded-lg
                       text-sm text-white font-mono appearance-none cursor-pointer
                       focus:outline-none focus:border-brand-500/50"
          >
            <option value="active">Active</option>
            <option value="all">All Today</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* ── Sessions grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="animate-spin text-brand-400" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Activity size={40} className="mx-auto text-gray-700 mb-3" />
          <h3 className="text-lg font-display font-bold text-gray-400">No Sessions Found</h3>
          <p className="text-sm text-gray-600 mt-1 font-mono">
            {statusFilter === "active" ? "No active sessions at the moment." : "No sessions match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(session => {
            const StatusIcon = STATUS_ICONS[session.status] || Radio;
            const isActive = session.status === "active";
            const qrValid  = session.isQRValid;

            return (
              <div
                key={session._id}
                className={`bg-surface-1 border rounded-xl p-5 transition hover:border-gray-600
                  ${isActive ? "border-green-500/30" : "border-surface-3"}`}
              >
                {/* Top row: course + status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-white truncate">
                      {session.courseId?.name || "Unknown Course"}
                    </h3>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">
                      {session.courseId?.code} • {session.courseId?.department}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono border shrink-0 ml-2 ${STATUS_COLORS[session.status]}`}>
                    <StatusIcon size={11} className={isActive ? "animate-pulse" : ""} />
                    {session.status}
                  </span>
                </div>

                {/* Details grid */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users size={14} className="text-gray-600 shrink-0" />
                    <span className="font-mono">
                      Teacher: <span className="text-white">{session.teacherId?.name || "—"}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={14} className="text-gray-600 shrink-0" />
                    <span className="font-mono">
                      {new Date(session.date).toLocaleDateString()} • {session.startTime}
                      {session.endTime ? ` – ${session.endTime}` : ""}
                    </span>
                  </div>

                  {session.location?.name && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin size={14} className="text-gray-600 shrink-0" />
                      <span className="font-mono truncate">{session.location.name}</span>
                    </div>
                  )}

                  {/* QR Timer */}
                  {isActive && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Timer size={14} className="text-gray-600 shrink-0" />
                      <span className="font-mono">
                        QR:{" "}
                        <span className={qrValid ? "text-green-400" : "text-red-400"}>
                          {qrValid ? formatTimer(session.timeRemaining) : "Expired"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Attendance bar */}
                <div className="mt-4 pt-3 border-t border-surface-2">
                  <div className="flex justify-between text-xs font-mono text-gray-500 mb-1.5">
                    <span>Attendance</span>
                    <span className="text-white">
                      {(session.presentCount || 0) + (session.lateCount || 0)} / {session.totalStudents || 0}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{
                        width: session.totalStudents > 0
                          ? `${Math.round((((session.presentCount || 0) + (session.lateCount || 0)) / session.totalStudents) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setSelected(session)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                               bg-brand-500/10 text-brand-400 border border-brand-500/20
                               hover:bg-brand-500/20 text-xs font-mono transition"
                  >
                    <Eye size={14} /> View Attendance
                  </button>

                  {isActive && (
                    <>
                      <button
                        onClick={() => handleEnd(session._id)}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg
                                   bg-blue-500/10 text-blue-400 border border-blue-500/20
                                   hover:bg-blue-500/20 text-xs font-mono transition"
                        title="End session"
                      >
                        <StopCircle size={14} />
                      </button>
                      <button
                        onClick={() => handleCancel(session._id)}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg
                                   bg-red-500/10 text-red-400 border border-red-500/20
                                   hover:bg-red-500/20 text-xs font-mono transition"
                        title="Cancel session"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Attendance Modal ── */}
      {selected && <AttendanceModal session={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
