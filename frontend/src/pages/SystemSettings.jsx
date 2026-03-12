import React, { useState } from "react";
import {
  Settings, QrCode, MapPin, Percent, Save, RefreshCw,
  Info, CheckCircle2, Clock, Shield, Globe,
} from "lucide-react";

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, showToast: show };
}

// ─── Settings Card ────────────────────────────────────────────────────────────
function SettingCard({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-surface-1 border border-surface-3 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20
                        flex items-center justify-center shrink-0">
          <Icon size={20} className="text-brand-400" />
        </div>
        <div>
          <h3 className="font-display font-bold text-white text-sm">{title}</h3>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Range Slider ─────────────────────────────────────────────────────────────
function RangeInput({ label, value, onChange, min, max, step = 1, unit = "" }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-400 font-mono">{label}</span>
        <span className="text-white font-mono font-bold">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-surface-2 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface-1"
      />
      <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const STORAGE_KEY = "sas_system_settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

const DEFAULTS = {
  qrDuration:           10,    // minutes
  qrAutoRegenerate:     true,
  defaultGeofenceRadius: 100,  // meters
  geofenceEnabled:      true,
  attendanceThreshold:  75,    // percent
  lateThreshold:        15,    // minutes
  sessionAutoExpire:    true,
  antiSpoofing:         true,
};

export default function SystemSettings() {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULTS,
    ...loadSettings(),
  }));
  const [saving, setSaving]     = useState(false);
  const { toast, showToast }    = useToast();

  const update = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      showToast("Settings saved successfully");
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
    localStorage.removeItem(STORAGE_KEY);
    showToast("Settings reset to defaults");
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
            <Settings className="text-brand-400" size={24} />
            System Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">
            Configure attendance system defaults and thresholds
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 text-gray-300
                       border border-surface-3 hover:border-gray-600 text-xs font-mono transition"
          >
            <RefreshCw size={14} /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white
                       text-xs font-mono hover:bg-brand-600 disabled:opacity-50 transition"
          >
            <Save size={14} /> {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
        <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-300/70 font-mono">
          These settings are stored locally and apply as defaults when creating new sessions or courses.
          They do not retroactively change existing data.
        </p>
      </div>

      {/* ── Settings Grid ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Code Settings */}
        <SettingCard
          icon={QrCode}
          title="QR Code Settings"
          description="Configure QR code generation and expiry"
        >
          <div className="space-y-5">
            <RangeInput
              label="QR Validity Duration"
              value={settings.qrDuration}
              onChange={v => update("qrDuration", v)}
              min={1}
              max={60}
              unit=" min"
            />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-mono">Auto-Regenerate QR</p>
                <p className="text-[11px] text-gray-500 font-mono">
                  Automatically refresh QR when it expires during active session
                </p>
              </div>
              <button
                onClick={() => update("qrAutoRegenerate", !settings.qrAutoRegenerate)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.qrAutoRegenerate ? "bg-brand-500" : "bg-surface-3"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.qrAutoRegenerate ? "translate-x-[22px]" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </div>
        </SettingCard>

        {/* Geofence Settings */}
        <SettingCard
          icon={Globe}
          title="Geofence Settings"
          description="Location-based attendance verification"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-mono">Enable Geofencing</p>
                <p className="text-[11px] text-gray-500 font-mono">
                  Require students to be within range of classroom
                </p>
              </div>
              <button
                onClick={() => update("geofenceEnabled", !settings.geofenceEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.geofenceEnabled ? "bg-brand-500" : "bg-surface-3"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.geofenceEnabled ? "translate-x-[22px]" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            <RangeInput
              label="Default Geofence Radius"
              value={settings.defaultGeofenceRadius}
              onChange={v => update("defaultGeofenceRadius", v)}
              min={25}
              max={500}
              step={25}
              unit="m"
            />
          </div>
        </SettingCard>

        {/* Attendance Thresholds */}
        <SettingCard
          icon={Percent}
          title="Attendance Thresholds"
          description="Configure attendance percentage requirements"
        >
          <div className="space-y-5">
            <RangeInput
              label="Minimum Attendance %"
              value={settings.attendanceThreshold}
              onChange={v => update("attendanceThreshold", v)}
              min={50}
              max={100}
              step={5}
              unit="%"
            />

            <div className="flex gap-2 flex-wrap">
              {[
                { pct: settings.attendanceThreshold, color: "text-green-400", label: "Safe" },
                { pct: Math.max(50, settings.attendanceThreshold - 10), color: "text-yellow-400", label: "Warning" },
                { pct: Math.max(40, settings.attendanceThreshold - 20), color: "text-red-400", label: "Critical" },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-surface-3">
                  <span className={`text-xs font-mono font-bold ${t.color}`}>≥ {t.pct}%</span>
                  <span className="text-[10px] text-gray-500 font-mono">{t.label}</span>
                </div>
              ))}
            </div>

            <RangeInput
              label="Late Threshold"
              value={settings.lateThreshold}
              onChange={v => update("lateThreshold", v)}
              min={5}
              max={30}
              unit=" min"
            />
            <p className="text-[11px] text-gray-600 font-mono -mt-3">
              Students marking attendance after this many minutes are marked as "late"
            </p>
          </div>
        </SettingCard>

        {/* Security & Session Settings */}
        <SettingCard
          icon={Shield}
          title="Security & Session"
          description="Anti-spoofing and session behaviour"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-mono">Auto-Expire Sessions</p>
                <p className="text-[11px] text-gray-500 font-mono">
                  Automatically expire sessions after QR expires
                </p>
              </div>
              <button
                onClick={() => update("sessionAutoExpire", !settings.sessionAutoExpire)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.sessionAutoExpire ? "bg-brand-500" : "bg-surface-3"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.sessionAutoExpire ? "translate-x-[22px]" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-mono">Anti-Spoofing Detection</p>
                <p className="text-[11px] text-gray-500 font-mono">
                  Flag suspicious patterns (same IP, identical GPS, etc.)
                </p>
              </div>
              <button
                onClick={() => update("antiSpoofing", !settings.antiSpoofing)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  settings.antiSpoofing ? "bg-brand-500" : "bg-surface-3"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.antiSpoofing ? "translate-x-[22px]" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            {/* Current settings summary */}
            <div className="mt-2 p-3 rounded-lg bg-surface-2 border border-surface-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-2">
                Current Configuration
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">QR Duration</span>
                  <span className="text-white">{settings.qrDuration}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Geofence</span>
                  <span className="text-white">{settings.defaultGeofenceRadius}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Min Attendance</span>
                  <span className="text-white">{settings.attendanceThreshold}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Late After</span>
                  <span className="text-white">{settings.lateThreshold}m</span>
                </div>
              </div>
            </div>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}
