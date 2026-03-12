import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import QRCode from "qrcode";
import {
  QrCode, RefreshCw, ChevronLeft, CheckCircle2,
  AlertCircle, StopCircle, Timer, MapPin,
  UserCheck, Copy, Check, Download, Eye,
  Circle, TrendingUp,
} from "lucide-react";

// ─── Countdown ring ───────────────────────────────────────────────────────────
function CountdownRing({ secondsLeft, totalSeconds }) {
  const size  = 110;
  const r     = 44;
  const circ  = 2 * Math.PI * r;
  const pct   = totalSeconds > 0 ? Math.max(0, secondsLeft / totalSeconds) : 0;
  const color = pct > 0.5 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";
  const mins  = Math.floor(secondsLeft / 60);
  const secs  = secondsLeft % 60;

  return (
    <div className="relative flex items-center justify-center"
         style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute">
        <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke="#ffffff08" strokeWidth={7} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
                stroke={color} strokeWidth={7}
                strokeDasharray={`${pct * circ} ${circ}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s linear, stroke 0.5s" }} />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-xl font-mono font-bold text-white">
          {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
        </span>
        <span className="text-[9px] font-mono text-gray-500">left</span>
      </div>
    </div>
  );
}

// ─── Attendance row ───────────────────────────────────────────────────────────
function AttendanceRow({ record, index }) {
  const colors = { present: "text-green-400", late: "text-yellow-400", absent: "text-gray-500" };
  const time   = new Date(record.markedAt).toLocaleTimeString("en-US",
    { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center justify-between px-4 py-2.5
                    border-b border-surface-2/50 last:border-0
                    hover:bg-surface-2/30 transition-colors animate-fade-up"
         style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-gray-700 w-5 text-right">{index+1}</span>
        <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20
                        flex items-center justify-center shrink-0">
          <span className="text-[10px] font-mono text-blue-400">
            {(record.studentId?.name || "?")[0].toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-200 font-body leading-tight">
            {record.studentId?.name || "Unknown"}
          </p>
          <p className="text-[10px] text-gray-600 font-mono">
            {record.studentId?.universityId || record.studentId?.email || ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {record.isSuspicious && (
          <AlertCircle size={12} className="text-red-400" title="Flagged" />
        )}
        <span className="text-[10px] font-mono text-gray-600">{time}</span>
        <span className={`text-xs font-mono font-semibold capitalize ${colors[record.status] || "text-gray-400"}`}>
          {record.status}
        </span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SessionPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [session,     setSession]     = useState(null);
  const [qrDataUrl,   setQrDataUrl]   = useState(null);
  const [qrString,    setQrString]    = useState("");
  const [attendance,  setAttendance]  = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [qrLoading,   setQrLoading]   = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSecs,   setTotalSecs]   = useState(0);
  const [copied,      setCopied]      = useState(false);
  const [ending,      setEnding]      = useState(false);

  const timerRef = useRef(null);
  const pollRef  = useRef(null);

  // ── Render QR image from string ──────────────────────────────────────────
  const renderQR = useCallback(async (qrStr) => {
    if (!qrStr) return;
    setQrString(qrStr);
    try {
      const url = await QRCode.toDataURL(qrStr, {
        width: 280, margin: 2,
        color: { dark: "#ffffff", light: "#161b22" },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error("QR render error:", e);
    }
  }, []);

  // ── Start countdown from qrExpiry field ──────────────────────────────────
  const startCountdown = useCallback((qrExpiry, durationMinutes) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!qrExpiry) return;

    const expiry = new Date(qrExpiry).getTime();
    const total  = (durationMinutes || 10) * 60;
    setTotalSecs(total);

    const tick = () => {
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) clearInterval(timerRef.current);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  }, []);

  // ── Load session from backend ─────────────────────────────────────────────
  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/session/${id}`);
      const s = data.session || data;
      setSession(s);

      if (s.qrCode) {
        await renderQR(s.qrCode);
        startCountdown(s.qrExpiry, s.qrDuration);
      }
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [id, renderQR, startCountdown]);

  // ── Fetch attendance ──────────────────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    try {
      const { data } = await api.get(`/attendance/session/${id}`);
      setAttendance(data.records || []);
      setSummary(data.summary   || null);
    } catch (err) {
      // non-fatal: attendance panel just won't update
    }
  }, [id]);

  // ── Generate QR if session has none ──────────────────────────────────────
  const generateQR = useCallback(async (sess) => {
    if (!sess || sess.qrCode || sess.status !== "active") return;
    setQrLoading(true);
    try {
      const duration = sess.qrDuration || 10;
      const { data } = await api.post(`/session/${id}/generate-qr`, { qrDuration: duration });
      const qr     = data.qrCode;
      const expiry = data.qrExpiry;
      if (qr) {
        await renderQR(qr);
        startCountdown(expiry, duration);
        setSession(prev => ({ ...prev, qrCode: qr, qrExpiry: expiry }));
      }
    } catch (err) {
      // silent — QR will show regenerate button
    } finally {
      setQrLoading(false);
    }
  }, [id, renderQR, startCountdown]);

  // ── Regenerate QR ─────────────────────────────────────────────────────────
  const handleRegenerate = async () => {
    setQrLoading(true);
    try {
      const duration = session?.qrDuration || 10;
      const { data } = await api.post(`/session/${id}/regenerate-qr`, { qrDuration: duration });
      const s      = data.session || data;
      const qr     = s.qrCode  || data.qrCode;
      const expiry = s.qrExpiry || data.qrExpiry;
      if (qr) {
        await renderQR(qr);
        startCountdown(expiry, duration);
        setSession(prev => ({ ...prev, qrCode: qr, qrExpiry: expiry, status: "active" }));
      }
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || "Failed to regenerate QR");
    } finally {
      setQrLoading(false);
    }
  };

  // ── End session ───────────────────────────────────────────────────────────
  const handleEnd = async () => {
    if (!window.confirm("End this session? Students can no longer mark attendance.")) return;
    setEnding(true);
    try {
      await api.patch(`/session/${id}/end`, {});
      navigate("/dashboard/teacher/classes");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to end session");
      setEnding(false);
    }
  };

  // ── Copy / Download ───────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(qrString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a    = document.createElement("a");
    a.href     = qrDataUrl;
    a.download = `qr-${session?.courseId?.code || "session"}.png`;
    a.click();
  };

  // ── Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSession();
    fetchAttendance();
    pollRef.current = setInterval(fetchAttendance, 10000);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(pollRef.current);
    };
  }, [fetchSession, fetchAttendance]);

  // ── Auto-generate QR once session loads and has none ─────────────────────
  useEffect(() => {
    if (session && !session.qrCode && session.status === "active") {
      generateQR(session);
    }
  }, [session, generateQR]);

  // ── Auto-regenerate QR when countdown hits 0 (active sessions only) ──────
  useEffect(() => {
    if (secondsLeft === 0 && session?.status === "active" && qrDataUrl && !qrLoading) {
      handleRegenerate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="text-blue-400 animate-spin" />
          <p className="text-sm text-gray-500 font-body">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <div className="text-center">
          <p className="text-gray-300 font-display font-semibold">{error}</p>
          <p className="text-gray-500 text-xs font-body mt-1">
            Session ID: {id}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchSession}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10
                       hover:bg-blue-500/20 border border-blue-500/20
                       text-blue-400 text-sm font-display rounded-lg transition-all">
            <RefreshCw size={13} /> Retry
          </button>
          <button onClick={() => navigate("/dashboard/teacher/classes")}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-2
                       hover:bg-surface-3 border border-surface-3
                       text-gray-300 text-sm font-display rounded-lg transition-all">
            <ChevronLeft size={13} /> Go back
          </button>
        </div>
      </div>
    );
  }

  const course    = session?.courseId || {};
  const isActive  = session?.status === "active";
  const qrExpired = secondsLeft === 0 && !!session?.qrExpiry;

  const stats = useMemo(() => {
    const present  = summary?.present || attendance.filter(r => r.status === "present").length;
    const late     = summary?.late    || attendance.filter(r => r.status === "late").length;
    const enrolled = summary?.totalEnrolled || 0;
    const marked   = present + late;
    const pct      = enrolled > 0 ? Math.round((marked / enrolled) * 100) : 0;
    return { present, late, enrolled, marked, pct };
  }, [summary, attendance]);

  const { presentCount, lateCount, totalEnrolled, marked, pct } = {
    presentCount: stats.present, lateCount: stats.late,
    totalEnrolled: stats.enrolled, marked: stats.marked, pct: stats.pct,
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="animate-fade-up flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard/teacher/classes")}
            className="w-8 h-8 bg-surface-2 hover:bg-surface-3 border border-surface-3
                       rounded-lg flex items-center justify-center text-gray-400
                       hover:text-white transition-all">
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-display font-bold text-white">
                {course.name || "Session"}
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border
                flex items-center gap-1
                ${isActive
                  ? "bg-brand-500/10 border-brand-500/20 text-brand-400"
                  : "bg-surface-2 border-surface-3 text-gray-500"}`}>
                {isActive
                  ? <><span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />Live</>
                  : session?.status || "—"}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {course.code} · {session?.startTime} · {session?.location?.name || "No location set"}
            </p>
          </div>
        </div>
        {isActive && (
          <button onClick={handleEnd} disabled={ending}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10
                       hover:bg-red-500/20 border border-red-500/20
                       text-red-400 text-sm font-display rounded-lg transition-all
                       disabled:opacity-50">
            <StopCircle size={14} />
            {ending ? "Ending..." : "End Session"}
          </button>
        )}
      </div>

      {/* ── Error banner (non-fatal) ─────────────────────────────────────── */}
      {error && session && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border
                        border-red-500/20 rounded-xl animate-fade-up">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-400 font-body">{error}</p>
          <button onClick={() => setError("")}
            className="ml-auto text-red-400 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── QR Panel ────────────────────────────────────────────────────── */}
        <div className="bg-surface-1 border border-surface-2 rounded-2xl overflow-hidden
                        animate-fade-up" style={{ animationDelay: "80ms" }}>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-brand-500" />
          <div className="p-6 flex flex-col items-center gap-4">

            {/* Panel header */}
            <div className="flex items-center justify-between w-full">
              <h2 className="text-sm font-display font-semibold text-white
                             flex items-center gap-2">
                <QrCode size={14} className="text-blue-400" /> QR Code
              </h2>
              {isActive && (
                <button onClick={handleRegenerate} disabled={qrLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2
                             hover:bg-surface-3 border border-surface-3 rounded-lg
                             text-gray-400 hover:text-white text-xs font-display transition-all
                             disabled:opacity-50">
                  <RefreshCw size={11} className={qrLoading ? "animate-spin" : ""} />
                  Regenerate
                </button>
              )}
            </div>

            {/* QR image */}
            <div className={`relative rounded-2xl overflow-hidden border-2 transition-all
                             ${qrExpired && !qrLoading
                               ? "border-red-500/30"
                               : "border-surface-3"}`}>
              {qrLoading ? (
                <div className="w-[260px] h-[260px] bg-surface-2
                                flex flex-col items-center justify-center gap-3">
                  <RefreshCw size={28} className="text-blue-400 animate-spin" />
                  <p className="text-xs font-mono text-gray-500">Generating QR...</p>
                </div>
              ) : qrDataUrl ? (
                <>
                  <img src={qrDataUrl} alt="Session QR Code"
                       className={`w-[260px] h-[260px] block transition-opacity
                                   ${qrExpired ? "opacity-30" : "opacity-100"}`} />
                  {qrExpired && (
                    <div className="absolute inset-0 flex flex-col items-center
                                    justify-center gap-2 bg-black/60">
                      <AlertCircle size={24} className="text-red-400" />
                      <p className="text-sm font-display font-bold text-red-400">QR Expired</p>
                      <button onClick={handleRegenerate}
                        className="text-xs text-blue-400 underline font-body">
                        Click to regenerate
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-[260px] h-[260px] bg-surface-2 border-2 border-dashed
                                border-surface-3 flex flex-col items-center justify-center gap-3">
                  <QrCode size={36} className="text-gray-700" />
                  <p className="text-xs font-mono text-gray-600 text-center px-4">
                    {isActive ? "Generating QR code..." : "Session not active"}
                  </p>
                </div>
              )}
            </div>

            {/* Countdown */}
            {isActive && session?.qrExpiry && !qrExpired && (
              <CountdownRing secondsLeft={secondsLeft} totalSeconds={totalSecs} />
            )}

            {/* Session details */}
            <div className="grid grid-cols-2 gap-2 w-full text-xs">
              <div className="bg-surface-2 border border-surface-3 rounded-xl p-2.5">
                <p className="font-mono text-gray-500 mb-0.5 flex items-center gap-1">
                  <Timer size={10} /> Duration
                </p>
                <p className="font-display font-bold text-white">
                  {session?.qrDuration || "—"} min
                </p>
              </div>
              <div className="bg-surface-2 border border-surface-3 rounded-xl p-2.5">
                <p className="font-mono text-gray-500 mb-0.5 flex items-center gap-1">
                  <MapPin size={10} /> Location
                </p>
                <p className="font-display font-bold text-white truncate">
                  {session?.location?.name || "Not set"}
                </p>
              </div>
            </div>

            {/* Actions */}
            {qrDataUrl && !qrExpired && (
              <div className="flex gap-2 w-full">
                <button onClick={handleDownload} title="Download QR as PNG"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2
                             bg-surface-2 hover:bg-surface-3 border border-surface-3
                             text-gray-300 text-xs font-display rounded-xl transition-all
                             active:scale-95">
                  <Download size={12} /> Download
                </button>
                <button onClick={handleCopy} title="Copy QR code string to clipboard"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2
                             bg-surface-2 hover:bg-surface-3 border border-surface-3
                             text-gray-300 text-xs font-display rounded-xl transition-all
                             active:scale-95">
                  {copied
                    ? <><Check size={12} className="text-green-400" /> Copied!</>
                    : <><Copy size={12} /> Copy Code</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Attendance Panel ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 animate-fade-up"
               style={{ animationDelay: "120ms" }}>
            {[
              { label: "Present", value: presentCount, color: "text-green-400" },
              { label: "Late",    value: lateCount,    color: "text-yellow-400" },
              { label: "Enrolled",value: totalEnrolled,color: "text-gray-300" },
            ].map(s => (
              <div key={s.label}
                   className="bg-surface-1 border border-surface-2 rounded-xl p-3 text-center">
                <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] font-mono text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          {totalEnrolled > 0 && (
            <div className="bg-surface-1 border border-surface-2 rounded-xl p-4
                            animate-fade-up" style={{ animationDelay: "160ms" }}>
              <div className="flex justify-between text-xs font-mono text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <TrendingUp size={11} /> Attendance Progress
                </span>
                <span>{marked}/{totalEnrolled} · {pct}%</span>
              </div>
              <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700
                                 ${pct >= 75 ? "bg-green-500"
                                   : pct >= 50 ? "bg-yellow-500"
                                   : "bg-blue-500"}`}
                     style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {/* Live list */}
          <div className="bg-surface-1 border border-surface-2 rounded-xl
                          overflow-hidden animate-fade-up flex flex-col"
               style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between px-4 py-3
                            border-b border-surface-2">
              <h3 className="text-sm font-display font-semibold text-white
                             flex items-center gap-2">
                <UserCheck size={14} className="text-brand-400" />
                Live Attendance
                <span className="text-[10px] font-mono text-gray-600 font-normal">
                  ({attendance.length})
                </span>
              </h3>
              <div className="flex items-center gap-2">
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                )}
                <button onClick={fetchAttendance}
                  className="text-[10px] font-mono text-gray-600
                             hover:text-gray-400 transition-colors">
                  refresh
                </button>
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
              {attendance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Eye size={24} className="text-gray-700" />
                  <p className="text-sm text-gray-500 font-body">
                    Waiting for students to scan...
                  </p>
                  <p className="text-[10px] font-mono text-gray-600">
                    Auto-refreshes every 10 seconds
                  </p>
                </div>
              ) : (
                attendance.map((r, i) => (
                  <AttendanceRow key={r._id || i} record={r} index={i} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}