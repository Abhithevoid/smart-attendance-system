import React, { useState, useEffect, useCallback } from "react";
import {
  Building2, Search, Plus, Edit2, Trash2, X, Check,
  AlertTriangle, RefreshCw, Filter, MoreVertical,
  ChevronDown, ChevronLeft, ChevronRight, MapPin,
  Crosshair, ToggleLeft, ToggleRight, Layers, Users,
  Navigation, ExternalLink,
} from "lucide-react";
import api from "../utils/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPES = ["classroom", "lab", "hall", "seminar", "auditorium", "other"];

const TYPE_CONFIG = {
  classroom:   { label: "Classroom",   badge: "bg-brand-500/10  text-brand-400  border-brand-500/20" },
  lab:         { label: "Lab",         badge: "bg-blue-500/10   text-blue-400   border-blue-500/20" },
  hall:        { label: "Hall",        badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  seminar:     { label: "Seminar",     badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  auditorium:  { label: "Auditorium",  badge: "bg-pink-500/10   text-pink-400   border-pink-500/20" },
  other:       { label: "Other",       badge: "bg-gray-500/10   text-gray-400   border-gray-500/20" },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, showToast: show };
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function ClassroomModal({ classroom, onClose, onSave }) {
  const isEdit = !!classroom?._id;

  const [form, setForm] = useState({
    name:     classroom?.name     || "",
    code:     classroom?.code     || "",
    building: classroom?.building || "",
    floor:    classroom?.floor    ?? 0,
    capacity: classroom?.capacity ?? 30,
    type:     classroom?.type     || "classroom",
    coordinates: {
      lat: classroom?.coordinates?.lat ?? "",
      lng: classroom?.coordinates?.lng ?? "",
    },
    radius:   classroom?.radius   ?? 100,
    facilities: {
      hasProjector:  classroom?.facilities?.hasProjector  ?? false,
      hasAC:         classroom?.facilities?.hasAC         ?? false,
      hasComputers:  classroom?.facilities?.hasComputers  ?? false,
      hasWhiteboard: classroom?.facilities?.hasWhiteboard ?? true,
    },
    notes: classroom?.notes || "",
  });

  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleChange = (name, value) => {
    setForm(p => ({ ...p, [name]: value }));
    setError("");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(p => ({
          ...p,
          coordinates: {
            lat: parseFloat(pos.coords.latitude.toFixed(6)),
            lng: parseFloat(pos.coords.longitude.toFixed(6)),
          },
        }));
        setGettingLocation(false);
      },
      (err) => {
        setError("Failed to get location: " + err.message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())     { setError("Room name is required"); return; }
    if (!form.code.trim())     { setError("Classroom code is required"); return; }
    if (!form.building.trim()) { setError("Building is required"); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        floor:    Number(form.floor)    || 0,
        capacity: Number(form.capacity) || 30,
        radius:   Number(form.radius)   || 100,
        coordinates: {
          lat: form.coordinates.lat !== "" ? Number(form.coordinates.lat) : null,
          lng: form.coordinates.lng !== "" ? Number(form.coordinates.lng) : null,
        },
      };

      if (isEdit) {
        const { data } = await api.put(`/classroom/${classroom._id}`, payload);
        onSave(data.classroom, "updated");
      } else {
        const { data } = await api.post("/classroom", payload);
        onSave(data.classroom, "created");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save classroom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-1 border border-surface-2 rounded-2xl
                      w-full max-w-lg max-h-[90vh] overflow-y-auto
                      shadow-2xl shadow-black/50 animate-fade-up"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2 sticky top-0 bg-surface-1 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20
                            rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-sm">
                {isEdit ? "Edit Classroom" : "Add Classroom"}
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                {isEdit ? classroom.code : "Fill in classroom details"}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center
                       text-gray-500 hover:text-white hover:bg-surface-2 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20
                            rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          {/* Name + Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Room Name <span className="text-brand-500">*</span>
              </label>
              <input value={form.name} onChange={e => handleChange("name", e.target.value)}
                placeholder="e.g., Room 101"
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:border-brand-500/50 focus:ring-1
                           focus:ring-brand-500/20 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Code <span className="text-brand-500">*</span>
              </label>
              <input value={form.code}
                onChange={e => handleChange("code", e.target.value.toUpperCase())}
                placeholder="e.g., CSB-LAB1"
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 uppercase
                           focus:outline-none focus:border-brand-500/50 focus:ring-1
                           focus:ring-brand-500/20 transition-all" />
            </div>
          </div>

          {/* Building + Floor + Capacity */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5 col-span-1">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Building <span className="text-brand-500">*</span>
              </label>
              <input value={form.building} onChange={e => handleChange("building", e.target.value)}
                placeholder="e.g., Main Block"
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                           focus:outline-none focus:border-brand-500/50 focus:ring-1
                           focus:ring-brand-500/20 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Floor</label>
              <input type="number" value={form.floor} min={-2} max={20}
                onChange={e => handleChange("floor", e.target.value)}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-4 py-2.5 text-sm text-gray-100
                           focus:outline-none focus:border-brand-500/50 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Capacity</label>
              <input type="number" value={form.capacity} min={1} max={1000}
                onChange={e => handleChange("capacity", e.target.value)}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-4 py-2.5 text-sm text-gray-100
                           focus:outline-none focus:border-brand-500/50 transition-all" />
            </div>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Type</label>
            <div className="relative">
              <select value={form.type} onChange={e => handleChange("type", e.target.value)}
                className="w-full bg-surface-2 border border-surface-3 rounded-lg
                           px-3 py-2.5 text-sm text-gray-100 appearance-none
                           focus:outline-none focus:border-brand-500/50 transition-all pr-8">
                {TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="p-4 rounded-xl bg-surface-2/50 border border-surface-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation size={14} className="text-brand-400" />
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">GPS Coordinates</span>
              </div>
              <button type="button" onClick={useCurrentLocation} disabled={gettingLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10
                           text-brand-400 text-xs font-mono hover:bg-brand-500/20
                           transition-colors disabled:opacity-50">
                {gettingLocation
                  ? <div className="w-3 h-3 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                  : <Crosshair size={12} />}
                {gettingLocation ? "Getting…" : "Use My Location"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-gray-500">Latitude</label>
                <input type="number" step="any" value={form.coordinates.lat}
                  onChange={e => setForm(p => ({
                    ...p, coordinates: { ...p.coordinates, lat: e.target.value },
                  }))}
                  placeholder="28.6142"
                  className="w-full bg-surface-3 border border-surface-3 rounded-lg
                             px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600
                             focus:outline-none focus:border-brand-500/50 transition-all" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-gray-500">Longitude</label>
                <input type="number" step="any" value={form.coordinates.lng}
                  onChange={e => setForm(p => ({
                    ...p, coordinates: { ...p.coordinates, lng: e.target.value },
                  }))}
                  placeholder="77.209"
                  className="w-full bg-surface-3 border border-surface-3 rounded-lg
                             px-3 py-2 text-sm text-gray-100 font-mono placeholder-gray-600
                             focus:outline-none focus:border-brand-500/50 transition-all" />
              </div>
            </div>

            {form.coordinates.lat && form.coordinates.lng && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                              bg-brand-500/5 border border-brand-500/10">
                <MapPin size={12} className="text-brand-400" />
                <span className="text-xs text-brand-300 font-mono">
                  {form.coordinates.lat}, {form.coordinates.lng}
                </span>
                <a href={`https://www.google.com/maps?q=${form.coordinates.lat},${form.coordinates.lng}`}
                   target="_blank" rel="noopener noreferrer"
                   className="ml-auto text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  View <ExternalLink size={9} />
                </a>
              </div>
            )}
          </div>

          {/* Geofence Radius */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Geofence Radius (metres)
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min={10} max={500} step={5} value={form.radius}
                onChange={e => handleChange("radius", Number(e.target.value))}
                className="flex-1 accent-brand-500" />
              <input type="number" value={form.radius} min={10} max={1000}
                onChange={e => handleChange("radius", e.target.value)}
                className="w-20 bg-surface-2 border border-surface-3 rounded-lg
                           px-2 py-1.5 text-xs text-gray-100 text-center font-mono
                           focus:outline-none focus:border-brand-500/50" />
              <span className="text-xs text-gray-500 font-mono">m</span>
            </div>
            <p className="text-[10px] text-gray-600">
              Students must be within this radius to mark attendance
            </p>
          </div>

          {/* Facilities */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Facilities</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "hasProjector",  label: "Projector" },
                { key: "hasAC",         label: "AC" },
                { key: "hasComputers",  label: "Computers" },
                { key: "hasWhiteboard", label: "Whiteboard" },
              ].map(f => (
                <label key={f.key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2
                             border border-surface-3 cursor-pointer hover:bg-surface-3 transition-colors">
                  <input type="checkbox" checked={form.facilities[f.key]}
                    onChange={e => setForm(p => ({
                      ...p, facilities: { ...p.facilities, [f.key]: e.target.checked },
                    }))}
                    className="accent-brand-500" />
                  <span className="text-xs text-gray-300">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Notes</label>
            <textarea value={form.notes} onChange={e => handleChange("notes", e.target.value)}
              placeholder="Optional notes…" rows={2}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg
                         px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 resize-none
                         focus:outline-none focus:border-brand-500/50 focus:ring-1
                         focus:ring-brand-500/20 transition-all" />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 bg-surface-2 hover:bg-surface-3 border border-surface-3
                         text-gray-300 hover:text-white rounded-lg font-display text-sm transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg
                         font-display text-sm transition-all disabled:opacity-50 flex items-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Check size={15} />}
              {isEdit ? "Update" : "Add Classroom"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ classroom, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await onConfirm(classroom._id);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                    flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-1 border border-surface-2 rounded-2xl
                      w-full max-w-sm shadow-2xl shadow-black/50 animate-fade-up p-6 text-center"
           onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10
                        flex items-center justify-center">
          <AlertTriangle size={24} className="text-red-400" />
        </div>
        <h3 className="text-base font-display font-bold text-white mb-1">Delete Classroom?</h3>
        <p className="text-gray-400 text-sm mb-1">
          <span className="text-white font-semibold">{classroom.name}</span>
        </p>
        <p className="text-gray-600 text-xs font-mono mb-5">{classroom.code} — {classroom.building}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose}
            className="px-5 py-2.5 bg-surface-2 hover:bg-surface-3 border border-surface-3
                       text-gray-300 rounded-lg text-sm font-display transition-all">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20
                       text-red-400 rounded-lg text-sm font-display transition-all
                       disabled:opacity-50 flex items-center gap-2">
            {loading && <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);

  const [search, setSearch]             = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [showFilter, setShowFilter]     = useState(false);
  const [page, setPage]                 = useState(1);

  const [buildings, setBuildings] = useState([]);

  const [modal, setModal]               = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMenu, setOpenMenu]         = useState(null);

  const { toast, showToast } = useToast();

  // ── Fetch classrooms ──
  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search)         params.set("search", search);
      if (buildingFilter) params.set("building", buildingFilter);
      if (typeFilter)     params.set("type", typeFilter);
      params.set("page", page);
      params.set("limit", 50);

      const { data } = await api.get(`/classroom/all?${params}`);
      setClassrooms(data.classrooms || []);
      setTotal(data.total || 0);

      // Gather unique buildings for filter
      const allBuildings = [...new Set((data.classrooms || []).map(c => c.building).filter(Boolean))];
      setBuildings(prev => {
        const merged = [...new Set([...prev, ...allBuildings])];
        return merged.sort();
      });
    } catch (err) {
      console.error("fetchClassrooms:", err);
    } finally {
      setLoading(false);
    }
  }, [search, buildingFilter, typeFilter, page]);

  useEffect(() => { fetchClassrooms(); }, [fetchClassrooms]);
  useEffect(() => { setPage(1); }, [search, buildingFilter, typeFilter]);

  // ── Handlers ──
  const handleSave = (classroom, action) => {
    setModal(null);
    fetchClassrooms();
    showToast(`${classroom.name || "Classroom"} ${action} successfully`);
  };

  const handleDelete = async (classroomId) => {
    try {
      await api.delete(`/classroom/${classroomId}`);
      setDeleteTarget(null);
      fetchClassrooms();
      showToast("Classroom deleted successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete classroom", "error");
      setDeleteTarget(null);
    }
  };

  const handleToggle = async (classroom) => {
    try {
      const { data } = await api.patch(`/classroom/${classroom._id}/toggle`);
      setClassrooms(p => p.map(c =>
        c._id === classroom._id ? { ...c, isActive: data.classroom.isActive } : c
      ));
      showToast(`${classroom.name} ${data.classroom.isActive ? "activated" : "deactivated"}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to toggle status", "error");
    }
  };

  const handleSeed = async () => {
    try {
      const { data } = await api.post("/classroom/seed");
      showToast(data.message);
      fetchClassrooms();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to seed classrooms", "error");
    }
  };

  // ── Stats ──
  const stats = {
    total:      classrooms.length,
    withGPS:    classrooms.filter(c => c.coordinates?.lat && c.coordinates?.lng).length,
    buildings:  [...new Set(classrooms.map(c => c.building))].length,
    active:     classrooms.filter(c => c.isActive !== false).length,
    totalCap:   classrooms.reduce((s, c) => s + (c.capacity || 0), 0),
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl border
                         shadow-2xl animate-fade-up flex items-center gap-2 text-sm font-body
                         ${toast.type === "error"
                           ? "bg-red-500/10 border-red-500/20 text-red-400"
                           : "bg-brand-500/10 border-brand-500/20 text-brand-400"
                         }`}>
          {toast.type === "error" ? <AlertTriangle size={15} /> : <Check size={15} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Building2 size={22} className="text-purple-400" />
            Classroom Management
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-body">
            {total ? `${total} classrooms` : "Manage classrooms, locations & geofence"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleSeed}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface-3
                       border border-surface-3 text-gray-300 hover:text-white rounded-lg
                       font-display text-sm transition-all active:scale-[0.97]">
            <Layers size={14} /> Seed Defaults
          </button>
          <button onClick={fetchClassrooms}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface-3
                       border border-surface-3 text-gray-300 hover:text-white rounded-lg
                       font-display text-sm transition-all active:scale-[0.97]">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => setModal("create")}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600
                       text-white rounded-lg font-display text-sm transition-all
                       active:scale-[0.97] shadow-lg shadow-brand-500/20">
            <Plus size={16} /> Add Classroom
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-fade-up" style={{ animationDelay: "40ms" }}>
        {[
          { label: "Total",     value: stats.total,     icon: Building2, color: "text-brand-400",  bg: "bg-brand-500/10  border-brand-500/20" },
          { label: "With GPS",  value: stats.withGPS,   icon: MapPin,    color: "text-green-400",  bg: "bg-green-500/10  border-green-500/20" },
          { label: "Buildings", value: stats.buildings,  icon: Layers,    color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
          { label: "Active",    value: stats.active,     icon: Check,     color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
          { label: "Capacity",  value: stats.totalCap,   icon: Users,     color: "text-blue-400",   bg: "bg-blue-500/10   border-blue-500/20" },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl
                                         border bg-surface-1 ${s.bg}`}>
            <s.icon size={18} className={s.color} />
            <div>
              <p className="text-base font-display font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="animate-fade-up bg-surface-1 border border-surface-2 rounded-xl p-4 flex flex-col gap-3"
           style={{ animationDelay: "80ms" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input type="text" placeholder="Search by name, code or building…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-surface-3 rounded-lg
                         pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600
                         focus:outline-none focus:border-brand-500/50 focus:ring-1
                         focus:ring-brand-500/20 transition-all" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilter(p => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-display text-sm transition-all
                        ${showFilter
                          ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                          : "bg-surface-2 border-surface-3 text-gray-400 hover:text-white"
                        }`}>
            <Filter size={14} /> Filters
            {(buildingFilter || typeFilter) && <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />}
          </button>
        </div>

        {showFilter && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-surface-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Building:</span>
              <div className="relative">
                <select value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)}
                  className="bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-xs text-gray-100 appearance-none pr-7 focus:outline-none">
                  <option value="">All</option>
                  {buildings.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Type:</span>
              <div className="relative">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  className="bg-surface-2 border border-surface-3 rounded-lg px-3 py-2 text-xs text-gray-100 appearance-none pr-7 focus:outline-none">
                  <option value="">All</option>
                  {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
            {(buildingFilter || typeFilter) && (
              <button onClick={() => { setBuildingFilter(""); setTypeFilter(""); }}
                className="text-xs text-gray-500 hover:text-brand-400 transition-colors flex items-center gap-1">
                <X size={11} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Classroom Cards Grid */}
      <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center
                          bg-surface-1 border border-surface-2 rounded-xl">
            <Building2 size={36} className="text-gray-700 mb-3" />
            <p className="text-gray-400 font-display font-medium">No classrooms found</p>
            <p className="text-gray-600 text-sm mt-1 font-body">Add a classroom or seed defaults</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map(c => {
              const lat = c.coordinates?.lat;
              const lng = c.coordinates?.lng;
              const hasGPS = lat != null && lng != null;
              const typeCfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.other;

              return (
                <div key={c._id}
                  className="bg-surface-1 border border-surface-2 rounded-xl
                             hover:border-surface-3 transition-all group">

                  {/* Card Header */}
                  <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-display font-semibold text-sm truncate">{c.name}</h3>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full
                                          text-[10px] font-mono border ${typeCfg.badge}`}>
                          {typeCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">{c.code}</p>
                    </div>

                    {/* Actions menu */}
                    <div className="relative shrink-0">
                      <button onClick={() => setOpenMenu(openMenu === c._id ? null : c._id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center
                                   text-gray-500 hover:text-white hover:bg-surface-2 transition-colors">
                        <MoreVertical size={14} />
                      </button>
                      {openMenu === c._id && (
                        <div className="absolute right-0 top-8 w-32 bg-surface-2 border border-surface-3
                                        rounded-lg shadow-xl py-1 z-20">
                          <button onClick={() => { setModal(c); setOpenMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300
                                       hover:bg-surface-3 transition-colors">
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={() => { setDeleteTarget(c); setOpenMenu(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400
                                       hover:bg-red-500/10 transition-colors">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 pb-4 space-y-3">
                    {/* Building info */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Building2 size={11} className="text-gray-500" />
                        <span>{c.building}</span>
                      </div>
                      {c.floor !== undefined && (
                        <div className="flex items-center gap-1">
                          <Layers size={11} className="text-gray-500" />
                          <span>Floor {c.floor}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users size={11} className="text-gray-500" />
                        <span>{c.capacity}</span>
                      </div>
                    </div>

                    {/* GPS info */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-surface-3">
                      <MapPin size={12} className={hasGPS ? "text-brand-400" : "text-gray-600"} />
                      {hasGPS ? (
                        <>
                          <span className="text-xs text-gray-400 font-mono truncate flex-1">
                            {lat.toFixed(6)}, {lng.toFixed(6)}
                          </span>
                          <a href={`https://www.google.com/maps?q=${lat},${lng}`}
                             target="_blank" rel="noopener noreferrer"
                             className="text-[10px] text-brand-400 hover:text-brand-300 shrink-0 flex items-center gap-0.5">
                            Map <ExternalLink size={8} />
                          </a>
                        </>
                      ) : (
                        <span className="text-xs text-gray-600 font-mono">No GPS set</span>
                      )}
                    </div>

                    {/* Radius + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400
                                         text-[10px] font-mono border border-brand-500/20">
                          r={c.radius || 100}m
                        </span>
                      </div>
                      <button onClick={() => handleToggle(c)} className="flex items-center gap-1 group/toggle">
                        {c.isActive !== false
                          ? <ToggleRight size={16} className="text-brand-400 group-hover/toggle:text-brand-300" />
                          : <ToggleLeft  size={16} className="text-gray-600 group-hover/toggle:text-gray-400" />}
                        <span className={`text-[10px] font-mono ${c.isActive !== false ? "text-brand-400" : "text-gray-600"}`}>
                          {c.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <ClassroomModal
          classroom={modal === "create" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          classroom={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
