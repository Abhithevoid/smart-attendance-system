const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// ─── Session Schema ───────────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema(
  {
    // ── Course & Teacher ───────────────────────────────────────────────────
    courseId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Course",
      required: [true, "Course ID is required"],
    },

    teacherId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "Teacher ID is required"],
    },

    // ── Session date & time ────────────────────────────────────────────────
    date: {
      type:     Date,
      required: [true, "Session date is required"],
      default:  Date.now,
    },

    startTime: {
      type:  String,
      trim:  true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be HH:MM format"],
    },

    endTime: {
      type:  String,
      trim:  true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be HH:MM format"],
    },

    // ── QR Code ────────────────────────────────────────────────────────────
    qrCode: {
      type:    String,
      unique:  true,
      default: () => uuidv4(), // unique token per session
    },

    qrExpiry: {
      type:    Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
    },

    qrDuration: {
      type:    Number,
      default: 10,    // minutes — configurable by teacher
      min:     [1,  "QR duration must be at least 1 minute"],
      max:     [60, "QR duration cannot exceed 60 minutes"],
    },

    // ── Location (where the class is held) ─────────────────────────────────
    location: {
      name: {
        type:  String,
        trim:  true,
        default: "",   // e.g. "Room 201", "Lab 3"
      },
      lat: {
        type: Number,
        default: null,
      },
      lng: {
        type: Number,
        default: null,
      },
      radius: {
        type:    Number,
        default: 100,    // metres
        min:     [10,   "Radius must be at least 10 metres"],
        max:     [1000, "Radius cannot exceed 1000 metres"],
      },
    },

    // ── Status ─────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values:  ["active", "expired", "cancelled", "completed"],
        message: "Status must be active, expired, cancelled, or completed",
      },
      default: "active",
    },

    // ── Attendance summary (updated as students scan) ──────────────────────
    totalStudents:   { type: Number, default: 0 },
    presentCount:    { type: Number, default: 0 },
    absentCount:     { type: Number, default: 0 },
    lateCount:       { type: Number, default: 0 },

    // ── Notes ──────────────────────────────────────────────────────────────
    notes: {
      type:  String,
      trim:  true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
sessionSchema.index({ courseId:  1 });
sessionSchema.index({ teacherId: 1 });
sessionSchema.index({ date:      1 });
sessionSchema.index({ status:    1 });
sessionSchema.index({ courseId:  1, date: -1 });      // latest sessions per course
sessionSchema.index({ teacherId: 1, status: 1 });     // teacher's active sessions
sessionSchema.index({ qrCode:    1, status: 1 });     // QR validation lookup

// ─── Instance method: check if QR is still valid ─────────────────────────────
sessionSchema.methods.isQRValid = function () {
  const now = new Date();
  return (
    this.status   === "active" &&
    this.qrExpiry  >  now
  );
};

// ─── Instance method: get remaining QR time in seconds ───────────────────────
sessionSchema.methods.getQRTimeRemaining = function () {
  const now       = new Date();
  const remaining = Math.floor((this.qrExpiry - now) / 1000);
  return Math.max(0, remaining);
};

// ─── Instance method: expire the session ─────────────────────────────────────
sessionSchema.methods.expire = async function () {
  this.status = "expired";
  return this.save();
};

// ─── Instance method: regenerate QR code ──────────────────────────────────────
sessionSchema.methods.regenerateQR = async function (durationMinutes = 10) {
  this.qrCode      = uuidv4();
  this.qrDuration  = durationMinutes;
  this.qrExpiry    = new Date(Date.now() + durationMinutes * 60 * 1000);
  this.status      = "active";
  return this.save();
};

// ─── Static method: find active session by QR token ──────────────────────────
sessionSchema.statics.findByQRCode = async function (qrCode) {
  return this.findOne({ qrCode, status: "active" })
             .populate("courseId")
             .populate("teacherId", "name email");
};

// ─── Auto-expire sessions past their qrExpiry ─────────────────────────────────
// Call this periodically or on each QR scan attempt
sessionSchema.statics.expireOldSessions = async function () {
  const result = await this.updateMany(
    {
      status:   "active",
      qrExpiry: { $lt: new Date() },
    },
    { $set: { status: "expired" } }
  );
  return result.modifiedCount;
};

// ─── Pre-save: auto-set status to expired if qrExpiry passed ──────────────────
sessionSchema.pre("save", function () {
  if (this.qrExpiry && this.qrExpiry < new Date() && this.status === "active") {
    this.status = "expired";
  }
});

module.exports = mongoose.model("Session", sessionSchema);