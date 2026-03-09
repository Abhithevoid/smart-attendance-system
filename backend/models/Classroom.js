const mongoose = require("mongoose");

// ─── Classroom Schema ─────────────────────────────────────────────────────────
const classroomSchema = new mongoose.Schema(
  {
    // ── Identity ───────────────────────────────────────────────────────────
    name: {
      type:      String,
      required:  [true, "Classroom name is required"],
      trim:      true,
      minlength: [2,   "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    code: {
      type:      String,
      required:  [true, "Classroom code is required"],
      unique:    true,
      uppercase: true,
      trim:      true,
      match:     [/^[A-Z0-9\-]{2,20}$/, "Code must be alphanumeric with hyphens (e.g. CSB-LAB1)"],
    },

    // ── Physical location ──────────────────────────────────────────────────
    building: {
      type:     String,
      required: [true, "Building name is required"],
      trim:     true,
    },

    floor: {
      type:    Number,
      default: 0,
      min:     [-2, "Floor cannot be less than -2 (basement)"],
      max:     [20, "Floor cannot exceed 20"],
    },

    capacity: {
      type:    Number,
      default: 30,
      min:     [1,   "Capacity must be at least 1"],
      max:     [1000, "Capacity cannot exceed 1000"],
    },

    type: {
      type:    String,
      enum: {
        values:  ["classroom", "lab", "hall", "seminar", "auditorium", "other"],
        message: "Type must be classroom, lab, hall, seminar, auditorium, or other",
      },
      default: "classroom",
    },

    // ── GPS Coordinates (for geofencing) ───────────────────────────────────
    coordinates: {
      lat: {
        type:    Number,
        default: null,
        min:     [-90,  "Latitude must be between -90 and 90"],
        max:     [90,   "Latitude must be between -90 and 90"],
      },
      lng: {
        type:    Number,
        default: null,
        min:     [-180, "Longitude must be between -180 and 180"],
        max:     [180,  "Longitude must be between -180 and 180"],
      },
    },

    // ── Geofence radius ────────────────────────────────────────────────────
    radius: {
      type:    Number,
      default: 100,
      min:     [10,   "Radius must be at least 10 metres"],
      max:     [1000, "Radius cannot exceed 1000 metres"],
    },

    // ── Facilities ─────────────────────────────────────────────────────────
    facilities: {
      hasProjector:  { type: Boolean, default: false },
      hasAC:         { type: Boolean, default: false },
      hasComputers:  { type: Boolean, default: false },
      hasWhiteboard: { type: Boolean, default: true  },
    },

    // ── Status ─────────────────────────────────────────────────────────────
    isActive: {
      type:    Boolean,
      default: true,
    },

    notes: {
      type:    String,
      trim:    true,
      default: "",
      maxlength: [300, "Notes cannot exceed 300 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
classroomSchema.index({ code:     1 });
classroomSchema.index({ building: 1 });
classroomSchema.index({ type:     1 });
classroomSchema.index({ isActive: 1 });

// ─── Virtual: display name ────────────────────────────────────────────────────
classroomSchema.virtual("displayName").get(function () {
  return `${this.name} — ${this.building}`;
});

// ─── Virtual: has coordinates ─────────────────────────────────────────────────
classroomSchema.virtual("hasCoordinates").get(function () {
  return this.coordinates?.lat !== null && this.coordinates?.lng !== null;
});

// ─── Instance method: format for session location ─────────────────────────────
classroomSchema.methods.toSessionLocation = function () {
  return {
    name:   this.name,
    lat:    this.coordinates?.lat   || null,
    lng:    this.coordinates?.lng   || null,
    radius: this.radius,
  };
};

// ─── Static: seed default classrooms ─────────────────────────────────────────
classroomSchema.statics.seedDefaults = async function () {
  const { CLASSROOM_LOCATIONS } = require("../config/classrooms");

  let seeded = 0;
  for (const room of CLASSROOM_LOCATIONS) {
    const exists = await this.findOne({ code: room.id });
    if (!exists) {
      await this.create({
        name:        room.name,
        code:        room.id,
        building:    room.building,
        floor:       room.floor       || 1,
        capacity:    room.capacity    || 30,
        type:        room.type        || "classroom",
        coordinates: { lat: room.lat, lng: room.lng },
        radius:      room.radius      || 100,
      });
      seeded++;
    }
  }
  return seeded;
};

module.exports = mongoose.model("Classroom", classroomSchema);