import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import api from "../utils/api";
import {
  getCurrentPosition, watchPosition,
  GpsStatus, accuracyLabel, accuracyScore,
} from "../utils/geolocation";
import {
  QrCode, CameraOff, MapPin, Loader,
  CheckCircle2, XCircle, AlertCircle, ChevronLeft,
  Keyboard, RotateCcw, Shield, Navigation,
  Clock, UserCheck, Ban, RefreshCw,
} from "lucide-react";

// ─── Scanner states ───────────────────────────────────────────────────────────
const S = {
  GPS:        "gps",
  REQUESTING: "requesting",
  SCANNING:   "scanning",
  PROCESSING: "processing",
  SUCCESS:    "success",
  ERROR:      "error",
  NO_CAMERA:  "no_camera",
};

// ─── Error code → UI config ───────────────────────────────────────────────────
const ERR = {
  ALREADY_MARKED:   { icon: UserCheck, color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   title: "Already Marked",     hint: "Your attendance for this session is already recorded." },
  QR_EXPIRED:       { icon: Clock,     color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", title: "QR Code Expired",    hint: "Ask your teacher to regenerate the QR code." },
  OUTSIDE_GEOFENCE: { icon: Navigation,color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", title: "Outside Classroom",  hint: "You appear to be outside the allowed area. Move closer and retry." },
  INVALID_QR:       { icon: Ban,       color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    title: "Invalid QR Code",    hint: "Make sure you are scanning the correct QR code shown by your teacher." },
  DEFAULT:          { icon: XCircle,   color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20",    title: "Failed",             hint: "" },
};

// ─── GPS Badge ────────────────────────────────────────────────────────────────
function GPSBadge({ status, accuracy }) {
  const cfg = {
    [GpsStatus.IDLE]:        { color: "text-gray-500",   dot: "bg-gray-600",   label: "Location"       },
    [GpsStatus.GETTING]:     { color: "text-yellow-400", dot: "bg-yellow-400", label: "Getting GPS..." },
    [GpsStatus.OK]:          { color: "text-green-400",  dot: "bg-green-400",  label: "Location ready" },
    [GpsStatus.WEAK]:        { color: "text-yellow-400", dot: "bg-yellow-400", label: accuracyLabel(accuracy) },
    [GpsStatus.DENIED]:      { color: "text-red-400",    dot: "bg-red-400",    label: "Location denied"},
    [GpsStatus.UNAVAILABLE]: { color: "text-gray-500",   dot: "bg-gray-600",   label: "No GPS"         },
  };
  const c = cfg[status] || cfg[GpsStatus.IDLE];
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-2
                    border border-white/5 rounded-full">
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}
                        ${status === GpsStatus.GETTING ? "animate-pulse" : ""}`} />
      <span className={`text-[10px] font-mono ${c.color}`}>{c.label}</span>
    </div>
  );
}

// ─── GPS acquisition screen ───────────────────────────────────────────────────
function GPSScreen({ gpsStatus, accuracy, onSkip }) {
  const score = accuracyScore(accuracy);
  const isDone = gpsStatus !== GpsStatus.GETTING;

  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 gap-5 text-center">
      {/* Pulsing ring animation */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {[1, 0.6, 0.3].map((op, i) => (
          <div key={i} className="absolute rounded-full border border-brand-400"
               style={{
                 width:  `${35 + i * 22}%`,
                 height: `${35 + i * 22}%`,
                 opacity: isDone ? 0.2 : op,
                 animation: !isDone ? `ping ${1.1 + i * 0.35}s ease-out infinite` : "none",
               }} />
        ))}
        <div className={`w-12 h-12 rounded-full border-2 flex items-center
                         justify-center z-10 transition-all
                         ${isDone
                           ? "bg-green-500/20 border-green-400"
                           : "bg-brand-500/20 border-brand-400"}`}>
          <MapPin size={22} className={isDone ? "text-green-400" : "text-brand-400"} />
        </div>
      </div>

      <div>
        <p className="text-white font-display font-bold">
          {gpsStatus === GpsStatus.GETTING ? "Getting your location..." : "Location Ready"}
        </p>
        <p className="text-gray-500 text-xs font-body mt-1">
          {gpsStatus === GpsStatus.GETTING
            ? "Helps verify you are physically in the classroom"
            : accuracyLabel(accuracy)}
        </p>
      </div>

      {/* Accuracy signal bar */}
      {accuracy !== null && accuracy !== undefined && (
        <div className="w-full max-w-[180px]">
          <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700
                             ${score > 0.6 ? "bg-green-500"
                               : score > 0.3 ? "bg-yellow-500"
                               : "bg-red-500"}`}
                 style={{ width: `${score * 100}%` }} />
          </div>
          <p className="text-[10px] font-mono text-gray-600 text-center mt-1">
            {accuracyLabel(accuracy)}
          </p>
        </div>
      )}

      <button onClick={onSkip}
        className="text-xs text-gray-600 hover:text-gray-400 underline font-body transition-colors">
        Skip — mark without location
      </button>
    </div>
  );
}

// ─── Scan overlay (corner brackets + animated line) ──────────────────────────
function ScanOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-56 h-56">
        <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
        {/* Brackets */}
        {[
          "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
          "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
          "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
          "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
        ].map((cls, i) => (
          <div key={i} className={`absolute w-8 h-8 border-brand-400 ${cls}`} />
        ))}
        {/* Corner glow dots */}
        {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
          <div key={i} className={`absolute w-2 h-2 rounded-full bg-brand-400 ${pos} opacity-80`} />
        ))}
        {/* Animated scan line */}
        <div className="absolute left-1 right-1 h-px bg-gradient-to-r
                        from-transparent via-brand-400 to-transparent
                        animate-scan-line" />
        {/* Label */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-[11px] font-mono text-white/50">Align QR within frame</span>
        </div>
      </div>
    </div>
  );
}

// ─── Processing overlay ───────────────────────────────────────────────────────
function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/85 flex flex-col
                    items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-brand-400/20" />
        <div className="absolute inset-0 rounded-full border-2 border-brand-400
                        border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full bg-brand-500/10
                        flex items-center justify-center">
          <Shield size={18} className="text-brand-400" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-display font-semibold text-white">Verifying attendance...</p>
        <p className="text-[11px] font-mono text-gray-500 mt-0.5">Checking QR code &amp; location</p>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ result, onDone }) {
  const att = result.attendance || {};

  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]); // haptic on mobile
  }, []);

  return (
    <div className="flex flex-col items-center py-8 px-6 text-center animate-fade-up">
      {/* Animated checkmark */}
      <div className="relative w-24 h-24 mb-5">
        <div className="absolute inset-0 rounded-full bg-green-500/10
                        border-2 border-green-500/20 animate-ping opacity-25" />
        <div className="absolute inset-0 rounded-full bg-green-500/15
                        border-2 border-green-500/30 flex items-center justify-center">
          <CheckCircle2 size={44} className="text-green-400" />
        </div>
      </div>

      <h2 className="text-2xl font-display font-bold text-green-400 mb-1">
        Attendance Marked!
      </h2>
      <p className="text-sm text-gray-500 font-body mb-6">
        {result.message || "Your presence has been recorded successfully"}
      </p>

      {/* Details card */}
      <div className="w-full bg-surface-2 border border-surface-3 rounded-2xl
                      overflow-hidden mb-4">
        <div className="h-0.5 bg-gradient-to-r from-green-500 to-brand-500" />
        <div className="p-4 space-y-2.5">
          {[
            { label: "Course",   value: att.course?.name || "—",                    cls: "text-white" },
            { label: "Status",   value: att.status || "present",                    cls: att.status === "present" ? "text-green-400 capitalize" : "text-yellow-400 capitalize" },
            { label: "Time",     value: new Date(att.markedAt || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), cls: "text-gray-300" },
            { label: "Location", value: att.geofence?.isWithin ? "Verified ✓" : "Unverified", cls: att.geofence?.isWithin ? "text-green-400" : "text-yellow-400" },
          ].map(row => (
            <div key={row.label}
              className="flex justify-between text-xs
                         border-b border-surface-3/40 last:border-0 pb-2 last:pb-0">
              <span className="text-gray-500 font-body">{row.label}</span>
              <span className={`font-mono font-semibold ${row.cls}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weak GPS notice */}
      {att.geofence?.status === "weak_signal_skipped" && (
        <div className="w-full flex items-start gap-2 p-3 mb-4
                        bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-left">
          <AlertCircle size={13} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-yellow-400 font-body">
            Location verification was skipped due to weak GPS (laptop/desktop).
            Your teacher can see this is unverified.
          </p>
        </div>
      )}

      <button onClick={onDone}
        className="w-full py-3 bg-green-500 hover:bg-green-400 text-white
                   font-display font-semibold rounded-xl transition-all
                   shadow-lg shadow-green-500/20 active:scale-[0.97]">
        Done
      </button>
    </div>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────
function ErrorScreen({ result, onRetry, onDone }) {
  const cfg  = ERR[result.code] || ERR.DEFAULT;
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center py-8 px-6 text-center animate-fade-up">
      <div className={`w-20 h-20 rounded-full ${cfg.bg} border-2 ${cfg.border}
                       flex items-center justify-center mb-5`}>
        <Icon size={36} className={cfg.color} />
      </div>

      <h2 className={`text-xl font-display font-bold mb-2 ${cfg.color}`}>{cfg.title}</h2>
      <p className="text-sm text-gray-400 font-body mb-1 max-w-xs">{result.message}</p>
      {cfg.hint && <p className="text-xs text-gray-600 font-body mt-1 max-w-xs">{cfg.hint}</p>}

      {result.code === "OUTSIDE_GEOFENCE" && result.distance && (
        <div className="mt-4 w-full bg-surface-2 border border-surface-3
                        rounded-xl p-3 text-left space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Your distance</span>
            <span className="text-orange-400 font-mono">{result.distance}m away</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Allowed radius</span>
            <span className="text-gray-300 font-mono">{result.allowedRadius}m</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-6 w-full">
        <button onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 py-3
                     bg-surface-2 hover:bg-surface-3 border border-surface-3
                     rounded-xl text-gray-300 text-sm font-display transition-all">
          <RotateCcw size={14} /> Try Again
        </button>
        <button onClick={onDone}
          className="flex-1 flex items-center justify-center gap-2 py-3
                     bg-blue-500 hover:bg-blue-400 text-white text-sm
                     font-display font-semibold rounded-xl transition-all
                     shadow-lg shadow-blue-500/20">
          Go Back
        </button>
      </div>
    </div>
  );
}

// ─── Manual Entry ─────────────────────────────────────────────────────────────
function ManualEntry({ onSubmit, loading, onBack }) {
  const [code, setCode] = useState("");
  return (
    <div className="flex flex-col gap-4 p-5 animate-fade-up">
      <div className="flex items-center gap-2">
        <button onClick={onBack}
          className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3
                     flex items-center justify-center text-gray-400 transition-all">
          <ChevronLeft size={16} />
        </button>
        <div>
          <h3 className="text-sm font-display font-semibold text-white">Manual QR Entry</h3>
          <p className="text-[10px] text-gray-500 font-body">Paste the QR code string</p>
        </div>
      </div>
      <textarea rows={5} placeholder="Paste QR code string here..."
        value={code} onChange={e => setCode(e.target.value)}
        className="w-full bg-surface-2 border border-surface-3 rounded-xl
                   px-4 py-3 text-xs text-gray-200 placeholder-gray-600
                   font-mono focus:outline-none focus:border-blue-500/50
                   focus:ring-1 focus:ring-blue-500/20 resize-none" />
      <button onClick={() => onSubmit(code.trim())}
        disabled={!code.trim() || loading}
        className="w-full flex items-center justify-center gap-2 py-3
                   bg-blue-500 hover:bg-blue-400 text-white text-sm
                   font-display font-semibold rounded-xl transition-all
                   shadow-lg shadow-blue-500/20 active:scale-[0.97]
                   disabled:opacity-50 disabled:cursor-not-allowed">
        {loading
          ? <><Loader size={15} className="animate-spin" /> Verifying...</>
          : <><Shield size={15} /> Submit Code</>}
      </button>
    </div>
  );
}

// ─── Main QRScanner ───────────────────────────────────────────────────────────
export default function QRScanner({ sessionId: propSessionId }) {
  const { id: paramId } = useParams();
  const sessionId       = propSessionId || paramId;
  const navigate        = useNavigate();

  const [state,      setState]      = useState(S.GPS);
  const [result,     setResult]     = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [camError,   setCamError]   = useState("");
  const [gpsStatus,  setGpsStatus]  = useState(GpsStatus.GETTING);
  const [location,   setLocation]   = useState(null);

  const scannerRef  = useRef(null);
  const hasScanned  = useRef(false);
  // Stable ID — must not change between renders
  const scannerElId = useRef("qr-reader-" + (sessionId || "scan")).current;

  // ── Step 1: Get GPS ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    // Auto-skip GPS after 15 seconds regardless
    const autoSkipTimer = setTimeout(() => {
      if (!cancelled && state === S.GPS) setState(S.REQUESTING);
    }, 15000);

    (async () => {
      const pos = await getCurrentPosition({ timeout: 12000 });
      if (cancelled) return;
      setGpsStatus(pos.status);
      if (pos.lat !== null) setLocation(pos);
      // Move to camera regardless of GPS result
      setState(S.REQUESTING);
    })();
    return () => {
      cancelled = true;
      clearTimeout(autoSkipTimer);
    };
  }, []);

  // ── Submit QR ────────────────────────────────────────────────────────────
  const submitQR = useCallback(async (qrCode) => {
    if (hasScanned.current) return;
    hasScanned.current = true;
    setProcessing(true);
    setState(S.PROCESSING);

    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }

    try {
      const payload = { qrCode };
      if (location?.lat != null) {
        payload.studentLat      = location.lat;
        payload.studentLng      = location.lng;
        payload.studentAccuracy = location.accuracy;
      }
      const { data } = await api.post("/attendance/mark", payload);
      setResult({ ...data, success: true });
      setState(S.SUCCESS);
    } catch (err) {
      const d = err.response?.data || {};
      setResult({
        success:       false,
        message:       err.friendlyMessage || d.message || "Failed to mark attendance",
        code:          d.code,
        distance:      d.distance,
        allowedRadius: d.allowedRadius,
      });
      setState(S.ERROR);
    } finally {
      setProcessing(false);
    }
  }, [location]);

  // ── Start camera ─────────────────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    setState(S.REQUESTING);
    setCamError("");
    hasScanned.current = false;

    await new Promise(r => setTimeout(r, 200)); // let DOM render

    try {
      const scanner = new Html5Qrcode(scannerElId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 220, height: 220 } },
        (decoded) => submitQR(decoded),
        () => {}
      );
      setState(S.SCANNING);
    } catch (err) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("permission") || msg.includes("NotAllowed") || msg.includes("denied")) {
        setCamError("Camera permission denied — tap the camera icon in your browser's address bar to allow access.");
      } else if (msg.includes("NotFound") || msg.toLowerCase().includes("no camera") || msg.toLowerCase().includes("not found")) {
        setCamError("No camera found on this device — use manual entry below.");
      } else if (msg.toLowerCase().includes("insecure") || msg.includes("https")) {
        setCamError("Camera requires HTTPS — open this page over a secure connection.");
      } else {
        setCamError("Could not start camera — try switching browsers or use manual entry.");
      }
      setState(S.NO_CAMERA);
    }
  }, [scannerElId, submitQR]);

  // ── Auto-start when state → REQUESTING ───────────────────────────────────
  useEffect(() => {
    if (state === S.REQUESTING) startScanner();
  }, [state, startScanner]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const handleRetry = useCallback(() => {
    hasScanned.current = false;
    setResult(null);
    setManualMode(false);
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {}).finally(() => {
        scannerRef.current = null;
        setState(S.REQUESTING);
      });
    } else {
      setState(S.REQUESTING);
    }
  }, []);

  const handleDone = () => navigate("/dashboard/student/classes");

  const isScanning    = state === S.SCANNING;
  const showCamera    = !manualMode && ![S.SUCCESS, S.ERROR, S.GPS].includes(state);

  return (
    <div className="max-w-sm mx-auto flex flex-col gap-4 pb-8">

      {/* Header */}
      <div className="animate-fade-up flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white
                     text-sm font-display transition-colors">
          <ChevronLeft size={18} /> Back
        </button>
        <GPSBadge status={gpsStatus} accuracy={location?.accuracy} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "40ms" }}>
        <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <QrCode size={20} className="text-brand-400" /> Scan Attendance QR
        </h1>
        <p className="text-gray-500 text-xs mt-1 font-body">
          Point your camera at the QR code shown by your teacher
        </p>
      </div>

      {/* Main panel */}
      <div className="bg-surface-1 border border-surface-2 rounded-2xl overflow-hidden
                      animate-fade-up" style={{ animationDelay: "80ms" }}>

        {/* GPS screen */}
        {state === S.GPS && (
          <GPSScreen gpsStatus={gpsStatus} accuracy={location?.accuracy}
                     onSkip={() => setState(S.REQUESTING)} />
        )}

        {/* Results */}
        {state === S.SUCCESS && result && <SuccessScreen result={result} onDone={handleDone} />}
        {state === S.ERROR   && result && <ErrorScreen   result={result} onRetry={handleRetry} onDone={handleDone} />}

        {/* Manual entry */}
        {manualMode && ![S.SUCCESS, S.ERROR].includes(state) && (
          <ManualEntry onSubmit={submitQR} loading={processing}
                       onBack={() => { setManualMode(false); handleRetry(); }} />
        )}

        {/* Camera view */}
        {showCamera && (
          <>
            <div className="relative bg-black" style={{ minHeight: 300 }}>
              <div id={scannerElId} className="w-full" />

              {/* Starting overlay */}
              {state === S.REQUESTING && (
                <div className="absolute inset-0 bg-black flex flex-col
                                items-center justify-center gap-3">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-brand-400/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-brand-400
                                    border-t-transparent animate-spin" />
                  </div>
                  <p className="text-xs font-mono text-gray-400">Starting camera...</p>
                </div>
              )}

              {/* Processing overlay */}
              {state === S.PROCESSING && <ProcessingOverlay />}

              {/* No camera */}
              {state === S.NO_CAMERA && (
                <div className="absolute inset-0 bg-black flex flex-col
                                items-center justify-center gap-3 p-6 text-center">
                  <CameraOff size={32} className="text-gray-600" />
                  <p className="text-sm text-gray-400 font-body">{camError}</p>
                  <button onClick={() => setManualMode(true)}
                    className="mt-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20
                               text-blue-400 text-xs font-display rounded-lg
                               hover:bg-blue-500/20 transition-all">
                    Use Manual Entry
                  </button>
                </div>
              )}

              {isScanning && <ScanOverlay />}
            </div>

            {/* Bottom bar */}
            <div className="px-4 py-3 border-t border-surface-2 flex items-center
                            justify-between">
              <div className="flex items-center gap-1.5">
                {isScanning && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                )}
                <span className="text-[10px] font-mono text-gray-600">
                  {isScanning ? "Scanning" : state}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isScanning && (
                  <button onClick={handleRetry}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-2
                               hover:bg-surface-3 border border-surface-3
                               rounded-lg text-gray-500 text-[10px] font-display transition-all">
                    <RefreshCw size={10} /> Restart
                  </button>
                )}
                <button onClick={() => setManualMode(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-2
                             hover:bg-surface-3 border border-surface-3
                             rounded-lg text-gray-400 text-[10px] font-display transition-all">
                  <Keyboard size={10} /> Manual
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* GPS warnings */}
      {gpsStatus === GpsStatus.DENIED && (
        <div className="animate-fade-up flex items-start gap-2 p-3
                        bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <AlertCircle size={13} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-yellow-400 font-body">
            Location access denied — attendance will be marked without geofence verification.
            Click the 🔒 lock icon in your address bar to enable it.
          </p>
        </div>
      )}

      {gpsStatus === GpsStatus.WEAK && (
        <div className="animate-fade-up flex items-start gap-2 p-3
                        bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <Navigation size={13} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-400 font-body">
            Weak GPS signal ({accuracyLabel(location?.accuracy)}) — normal on laptops.
            Attendance will still be marked, location check will be skipped.
          </p>
        </div>
      )}

      {/* Scanning instructions */}
      {isScanning && (
        <div className="animate-fade-up bg-surface-1 border border-surface-2
                        rounded-xl p-4" style={{ animationDelay: "120ms" }}>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2.5">
            How to scan
          </p>
          <ol className="space-y-2">
            {[
              "Hold your device steady",
              "Point camera at the teacher's QR code",
              "Keep the code inside the green frame",
              "Attendance is marked automatically",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-surface-2 border border-surface-3
                                 text-[9px] font-mono text-gray-600 flex items-center
                                 justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-xs text-gray-400 font-body">{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}