import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import api from "../utils/api";
import {
  QrCode, Camera, CameraOff, MapPin, Loader,
  CheckCircle2, XCircle, AlertCircle, ChevronLeft,
  Keyboard, RotateCcw, Wifi, WifiOff, Shield,
} from "lucide-react";

// ─── States ───────────────────────────────────────────────────────────────────
const STATES = {
  INIT:        "init",
  REQUESTING:  "requesting",
  SCANNING:    "scanning",
  PROCESSING:  "processing",
  SUCCESS:     "success",
  ERROR:       "error",
  NO_CAMERA:   "no_camera",
};

// ─── GPS hook ─────────────────────────────────────────────────────────────────
function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle | getting | ok | denied | unavailable

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }
    setGpsStatus("getting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat:      pos.coords.latitude,
          lng:      pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsStatus("ok");
      },
      (err) => {
        console.warn("GPS error:", err.message);
        setGpsStatus(err.code === 1 ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  return { location, gpsStatus, requestLocation };
}

// ─── GPS Badge ────────────────────────────────────────────────────────────────
function GPSBadge({ status }) {
  const config = {
    idle:        { icon: MapPin,  color: "text-gray-500",  bg: "bg-surface-2",  label: "Location" },
    getting:     { icon: Loader,  color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Getting GPS..." },
    ok:          { icon: MapPin,  color: "text-green-400",  bg: "bg-green-500/10", label: "Location ready" },
    denied:      { icon: WifiOff, color: "text-red-400",    bg: "bg-red-500/10",   label: "Location denied" },
    unavailable: { icon: WifiOff, color: "text-gray-500",   bg: "bg-surface-2",    label: "No GPS" },
  };
  const c = config[status] || config.idle;
  const Icon = c.icon;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 ${c.bg}
                     border border-white/5 rounded-full`}>
      <Icon size={11} className={`${c.color} ${status === "getting" ? "animate-spin" : ""}`} />
      <span className={`text-[10px] font-mono ${c.color}`}>{c.label}</span>
    </div>
  );
}

// ─── Scan overlay ─────────────────────────────────────────────────────────────
function ScanOverlay({ scanning }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* Dark corners */}
      <div className="absolute inset-0 bg-black/40" />
      {/* Cutout */}
      <div className="relative w-56 h-56">
        {/* Clear area */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden
                        shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
        {/* Corner brackets */}
        {["tl","tr","bl","br"].map(pos => (
          <div key={pos} className={`absolute w-8 h-8
            ${pos === "tl" ? "top-0 left-0 border-t-2 border-l-2 rounded-tl-xl" : ""}
            ${pos === "tr" ? "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl" : ""}
            ${pos === "bl" ? "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl" : ""}
            ${pos === "br" ? "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl" : ""}
            ${scanning ? "border-brand-400" : "border-white/40"}`} />
        ))}
        {/* Scan line */}
        {scanning && (
          <div className="absolute left-2 right-2 h-0.5 bg-brand-400/80
                          rounded-full animate-scan-line shadow-[0_0_8px_2px_rgba(34,197,94,0.4)]" />
        )}
        {/* Center label */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-[11px] font-mono text-white/60">
            {scanning ? "Align QR code within frame" : "Initializing..."}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────
function ResultScreen({ result, onRetry, onDone }) {
  const isSuccess = result.success;
  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center
                    animate-fade-up">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5
                       ${isSuccess
                         ? "bg-green-500/15 border-2 border-green-500/30"
                         : "bg-red-500/15 border-2 border-red-500/30"}`}>
        {isSuccess
          ? <CheckCircle2 size={36} className="text-green-400" />
          : <XCircle      size={36} className="text-red-400" />}
      </div>

      <h2 className={`text-xl font-display font-bold mb-2
                      ${isSuccess ? "text-green-400" : "text-red-400"}`}>
        {isSuccess ? "Attendance Marked!" : "Failed"}
      </h2>

      <p className="text-sm text-gray-400 font-body mb-1 max-w-xs">
        {result.message}
      </p>

      {isSuccess && result.attendance && (
        <div className="mt-4 w-full bg-surface-2 border border-surface-3
                        rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 font-body">Course</span>
            <span className="text-gray-200 font-mono">
              {result.attendance.course?.code}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 font-body">Status</span>
            <span className={`font-mono font-semibold capitalize
                              ${result.attendance.status === "present"
                                ? "text-green-400" : "text-yellow-400"}`}>
              {result.attendance.status}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 font-body">Location</span>
            <span className={`font-mono
                              ${result.attendance.geofence?.isWithin
                                ? "text-green-400" : "text-gray-500"}`}>
              {result.attendance.geofence?.isWithin ? "Verified ✓" : "Not checked"}
            </span>
          </div>
        </div>
      )}

      {result.warning && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-500/10
                        border border-yellow-500/20 rounded-xl w-full text-left">
          <AlertCircle size={13} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-yellow-400 font-body">{result.warning}</p>
        </div>
      )}

      <div className="flex gap-3 mt-6 w-full">
        {!isSuccess && (
          <button onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3
                       bg-surface-2 hover:bg-surface-3 border border-surface-3
                       rounded-xl text-gray-300 text-sm font-display transition-all">
            <RotateCcw size={14} /> Try Again
          </button>
        )}
        <button onClick={onDone}
          className={`flex-1 flex items-center justify-center gap-2 py-3
                      rounded-xl text-sm font-display font-semibold transition-all
                      ${isSuccess
                        ? "bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20"
                        : "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20"}`}>
          {isSuccess ? "Done" : "Go Back"}
        </button>
      </div>
    </div>
  );
}

// ─── Manual Entry ─────────────────────────────────────────────────────────────
function ManualEntry({ onSubmit, loading, onBack }) {
  const [code, setCode] = useState("");
  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={onBack}
          className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3
                     flex items-center justify-center text-gray-400 transition-all">
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-sm font-display font-semibold text-white">
          Enter Code Manually
        </h3>
      </div>
      <p className="text-xs text-gray-500 font-body">
        Ask your teacher to share the QR code string if camera isn't working.
      </p>
      <textarea
        rows={4}
        placeholder="Paste QR code string here..."
        value={code}
        onChange={e => setCode(e.target.value)}
        className="w-full bg-surface-2 border border-surface-3 rounded-xl
                   px-4 py-3 text-xs text-gray-200 placeholder-gray-600
                   font-mono focus:outline-none focus:border-blue-500/50
                   focus:ring-1 focus:ring-blue-500/20 resize-none" />
      <button
        onClick={() => onSubmit(code.trim())}
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function QRScanner({ sessionId: propSessionId }) {
  const { id: paramId } = useParams();
  const sessionId       = propSessionId || paramId;
  const navigate        = useNavigate();

  const [state,       setState]       = useState(STATES.INIT);
  const [result,      setResult]      = useState(null);
  const [manualMode,  setManualMode]  = useState(false);
  const [processing,  setProcessing]  = useState(false);
  const [camError,    setCamError]    = useState("");

  const scannerRef  = useRef(null);
  const scannerElId = "qr-reader";
  const hasScanned  = useRef(false);

  const { location, gpsStatus, requestLocation } = useGeolocation();

  // ── Request GPS on mount ────────────────────────────────────────────────────
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // ── Submit QR code to backend ────────────────────────────────────────────────
  const submitQR = useCallback(async (qrCode) => {
    if (hasScanned.current) return;
    hasScanned.current = true;
    setProcessing(true);
    setState(STATES.PROCESSING);

    // Stop scanner if running
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }

    try {
      const payload = { qrCode };
      if (location) {
        payload.studentLat      = location.lat;
        payload.studentLng      = location.lng;
        payload.studentAccuracy = location.accuracy;
      }

      const { data } = await api.post("/attendance/mark", payload);
      setResult(data);
      setState(STATES.SUCCESS);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to mark attendance";
      setResult({
        success: false,
        message: msg,
        code:    err.response?.data?.code,
        distance: err.response?.data?.distance,
        allowedRadius: err.response?.data?.allowedRadius,
      });
      setState(STATES.ERROR);
    } finally {
      setProcessing(false);
    }
  }, [location]);

  // ── Start camera scanner ─────────────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    setState(STATES.REQUESTING);
    setCamError("");

    // Small delay so DOM element renders
    await new Promise(r => setTimeout(r, 200));

    try {
      const scanner = new Html5Qrcode(scannerElId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 224, height: 224 } },
        (decodedText) => { submitQR(decodedText); },
        () => {} // ignore scan errors
      );
      setState(STATES.SCANNING);
    } catch (err) {
      console.error("Camera error:", err);
      const msg = err?.message || "";
      if (msg.includes("permission") || msg.includes("NotAllowed")) {
        setCamError("Camera permission denied — please allow camera access in your browser settings");
        setState(STATES.NO_CAMERA);
      } else if (msg.includes("NotFound") || msg.includes("no camera")) {
        setCamError("No camera found on this device");
        setState(STATES.NO_CAMERA);
      } else {
        setCamError("Could not start camera — try the manual entry option");
        setState(STATES.NO_CAMERA);
      }
    }
  }, [submitQR]);

  // ── Auto-start on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [startScanner]);

  const handleRetry = () => {
    hasScanned.current = false;
    setResult(null);
    setManualMode(false);
    startScanner();
  };

  const handleDone = () => navigate("/dashboard/student/classes");

  const isScanning = state === STATES.SCANNING;

  return (
    <div className="max-w-sm mx-auto flex flex-col gap-4">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="animate-fade-up flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white
                     text-sm font-display transition-colors">
          <ChevronLeft size={18} /> Back
        </button>
        <GPSBadge status={gpsStatus} />
      </div>

      <div className="animate-fade-up">
        <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <QrCode size={20} className="text-brand-400" />
          Scan Attendance QR
        </h1>
        <p className="text-gray-500 text-xs mt-1 font-body">
          Point your camera at the QR code shown by your teacher
        </p>
      </div>

      {/* ── Main panel ──────────────────────────────────────────────────────── */}
      <div className="bg-surface-1 border border-surface-2 rounded-2xl
                      overflow-hidden animate-fade-up" style={{ animationDelay: "80ms" }}>

        {/* Result state */}
        {(state === STATES.SUCCESS || state === STATES.ERROR) && result && (
          <ResultScreen result={result} onRetry={handleRetry} onDone={handleDone} />
        )}

        {/* Manual entry */}
        {manualMode && state !== STATES.SUCCESS && state !== STATES.ERROR && (
          <div className="p-5">
            <ManualEntry
              onSubmit={submitQR}
              loading={processing}
              onBack={() => { setManualMode(false); handleRetry(); }}
            />
          </div>
        )}

        {/* Camera view */}
        {!manualMode && state !== STATES.SUCCESS && state !== STATES.ERROR && (
          <>
            <div className="relative bg-black" style={{ minHeight: 300 }}>
              {/* Html5Qrcode target element */}
              <div id={scannerElId} className="w-full" />

              {/* Overlay */}
              {(state === STATES.REQUESTING || state === STATES.INIT) && (
                <div className="absolute inset-0 flex flex-col items-center
                                justify-center bg-black gap-3">
                  <Loader size={28} className="text-brand-400 animate-spin" />
                  <p className="text-xs font-mono text-gray-400">
                    Starting camera...
                  </p>
                </div>
              )}

              {state === STATES.PROCESSING && (
                <div className="absolute inset-0 flex flex-col items-center
                                justify-center bg-black/80 gap-3">
                  <Loader size={28} className="text-brand-400 animate-spin" />
                  <p className="text-xs font-mono text-gray-300">
                    Verifying attendance...
                  </p>
                </div>
              )}

              {state === STATES.NO_CAMERA && (
                <div className="absolute inset-0 flex flex-col items-center
                                justify-center bg-black gap-3 p-6 text-center">
                  <CameraOff size={32} className="text-gray-600" />
                  <p className="text-xs text-gray-400 font-body">{camError}</p>
                </div>
              )}

              {isScanning && <ScanOverlay scanning={isScanning} />}
            </div>

            {/* Bottom controls */}
            <div className="p-4 border-t border-surface-2 flex items-center
                            justify-between gap-3">
              <div className="text-xs font-mono text-gray-600">
                {isScanning ? "● Scanning" : state}
              </div>
              <button
                onClick={() => setManualMode(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-surface-2
                           hover:bg-surface-3 border border-surface-3 rounded-lg
                           text-gray-400 hover:text-gray-200 text-xs font-display
                           transition-all">
                <Keyboard size={12} />
                Manual entry
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── GPS warning ─────────────────────────────────────────────────────── */}
      {gpsStatus === "denied" && (
        <div className="animate-fade-up flex items-start gap-2 p-3
                        bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <AlertCircle size={13} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-yellow-400 font-body">
            Location access denied — attendance may be marked without geofence verification.
            Enable location in browser settings for full verification.
          </p>
        </div>
      )}
    </div>
  );
}