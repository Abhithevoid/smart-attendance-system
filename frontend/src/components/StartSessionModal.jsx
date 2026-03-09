import { useState, useEffect } from "react";
import api from "../utils/api";
import {
  X, MapPin, Clock, FileText, ChevronDown,
  PlayCircle, Loader, AlertCircle, Building2,
  Timer, StickyNote,
} from "lucide-react";

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, icon: Icon, children, hint }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-mono text-gray-400
                         uppercase tracking-wider mb-2">
        {Icon && <Icon size={11} className="text-gray-600" />}
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-600 font-body mt-1">{hint}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
function Select({ value, onChange, children, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full appearance-none bg-surface-2 border border-surface-3
                   rounded-xl px-4 py-3 text-sm text-gray-100 pr-10
                   focus:outline-none focus:border-blue-500/50
                   focus:ring-1 focus:ring-blue-500/20
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all cursor-pointer">
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2
                                        text-gray-500 pointer-events-none" />
    </div>
  );
}

// ─── Duration button ──────────────────────────────────────────────────────────
function DurationBtn({ value, selected, onClick }) {
  return (
    <button type="button" onClick={() => onClick(value)}
      className={`flex-1 py-2.5 rounded-xl text-sm font-mono transition-all
                  active:scale-[0.96] border
                  ${selected
                    ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "bg-surface-2 border-surface-3 text-gray-400 hover:border-blue-500/30 hover:text-gray-200"
                  }`}>
      {value}m
    </button>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function StartSessionModal({ course, onClose, onSuccess }) {
  const [classrooms,  setClassrooms]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error,       setError]       = useState("");

  const [form, setForm] = useState({
    classroomId: "",
    qrDuration:  10,
    startTime:   new Date().toTimeString().slice(0, 5),
    notes:       "",
    customDuration: "",
  });

  // Fetch classroom dropdown
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const { data } = await api.get("/classroom/dropdown");
        setClassrooms(data.classrooms || []);
      } catch {
        setClassrooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchClassrooms();
  }, []);

  const selectedRoom = classrooms.find(c => c.value === form.classroomId);

  const handleSubmit = async () => {
    setError("");

    const duration = form.customDuration
      ? parseInt(form.customDuration)
      : form.qrDuration;

    if (isNaN(duration) || duration < 1 || duration > 60) {
      setError("QR duration must be between 1 and 60 minutes");
      return;
    }

    setLoading(true);
    try {
      // 1. Create session
      const payload = {
        courseId:   course._id,
        date:       new Date().toISOString().slice(0, 10),
        startTime:  form.startTime,
        qrDuration: duration,
        notes:      form.notes.trim(),
      };

      // Attach classroom location if selected
      if (selectedRoom) {
        payload.location = {
          name:   selectedRoom.label.split(" —")[0],
          lat:    selectedRoom.lat,
          lng:    selectedRoom.lng,
          radius: selectedRoom.radius,
        };
      }

      const { data } = await api.post("/session/create", payload);

      // 2. Generate QR immediately
      await api.post(`/session/${data.session._id}/generate-qr`, {
        qrDuration: duration,
      });

      onSuccess(data.session);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-up">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
           onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#0f1117] border border-surface-2 rounded-2xl
                      w-full max-w-md shadow-2xl overflow-hidden">

        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-brand-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4
                        border-b border-surface-2">
          <div>
            <h2 className="text-base font-display font-bold text-white">
              Start Session
            </h2>
            <p className="text-xs text-gray-500 font-body mt-0.5">
              {course.code} · {course.name}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3
                       flex items-center justify-center text-gray-400
                       hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Classroom */}
          <Field label="Classroom" icon={Building2}
                 hint={selectedRoom
                   ? `Geofence radius: ${selectedRoom.radius}m`
                   : "Optional — enables geofencing for attendance"}>
            <Select
              value={form.classroomId}
              onChange={e => setForm(f => ({ ...f, classroomId: e.target.value }))}
              disabled={loadingRooms}>
              <option value="">
                {loadingRooms ? "Loading classrooms..." : "Select classroom (optional)"}
              </option>
              {classrooms.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
            {selectedRoom?.lat && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px]
                              font-mono text-brand-400">
                <MapPin size={10} />
                GPS: {selectedRoom.lat.toFixed(4)}, {selectedRoom.lng.toFixed(4)}
              </div>
            )}
          </Field>

          {/* Start Time */}
          <Field label="Start Time" icon={Clock}>
            <input
              type="time"
              value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              className="w-full bg-surface-2 border border-surface-3 rounded-xl
                         px-4 py-3 text-sm text-gray-100
                         focus:outline-none focus:border-blue-500/50
                         focus:ring-1 focus:ring-blue-500/20 transition-all" />
          </Field>

          {/* QR Duration */}
          <Field label="QR Validity" icon={Timer}
                 hint="Students must scan within this window">
            <div className="flex gap-2 mb-2">
              {[5, 10, 15, 30].map(d => (
                <DurationBtn
                  key={d}
                  value={d}
                  selected={form.qrDuration === d && !form.customDuration}
                  onClick={v => setForm(f => ({ ...f, qrDuration: v, customDuration: "" }))}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="60"
                placeholder="Custom (1–60 min)"
                value={form.customDuration}
                onChange={e => setForm(f => ({ ...f, customDuration: e.target.value }))}
                className="flex-1 bg-surface-2 border border-surface-3 rounded-xl
                           px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:border-blue-500/50
                           focus:ring-1 focus:ring-blue-500/20 transition-all" />
              <span className="text-xs font-mono text-gray-500 shrink-0">min</span>
            </div>
          </Field>

          {/* Notes */}
          <Field label="Notes" icon={StickyNote} hint="Optional — visible to you only">
            <textarea
              rows={2}
              placeholder="e.g. Chapter 5 — Sorting Algorithms"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-surface-2 border border-surface-3 rounded-xl
                         px-4 py-3 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:border-blue-500/50
                         focus:ring-1 focus:ring-blue-500/20 transition-all
                         resize-none leading-relaxed" />
          </Field>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10
                            border border-red-500/20 rounded-xl">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 font-body">{error}</p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-surface-2 border border-surface-3 rounded-xl p-3.5">
            <p className="text-[10px] font-mono text-gray-500 uppercase
                          tracking-wider mb-2">Session Summary</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-body">Course</span>
                <span className="text-gray-200 font-mono">{course.code}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-body">Location</span>
                <span className="text-gray-200 font-mono">
                  {selectedRoom ? selectedRoom.label.split(" —")[0] : "Not set"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-body">QR Valid For</span>
                <span className="text-gray-200 font-mono">
                  {form.customDuration || form.qrDuration} minutes
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 font-body">Enrolled Students</span>
                <span className="text-gray-200 font-mono">
                  {course.enrolledCount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-3 bg-surface-2 hover:bg-surface-3
                       border border-surface-3 rounded-xl text-gray-300
                       hover:text-white text-sm font-display transition-all
                       disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3
                       bg-blue-500 hover:bg-blue-400 text-white text-sm
                       font-display font-semibold rounded-xl transition-all
                       shadow-lg shadow-blue-500/20 active:scale-[0.97]
                       disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <><Loader size={15} className="animate-spin" /> Starting...</>
            ) : (
              <><PlayCircle size={15} /> Start Session</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}