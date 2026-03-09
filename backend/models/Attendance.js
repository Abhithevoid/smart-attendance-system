const mongoose = require("mongoose");

// ─── Attendance Schema ────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema(
  {
    // ── References ─────────────────────────────────────────────────────────
    sessionId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Session",
      required: [true, "Session ID is required"],
    },

    courseId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Course",
      required: [true, "Course ID is required"],
    },

    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "Student ID is required"],
    },

    teacherId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "Teacher ID is required"],
    },

    // ── Status ─────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values:  ["present", "absent", "late", "excused"],
        message: "Status must be present, absent, late, or excused",
      },
      default: "present",
    },

    // ── Timestamp ──────────────────────────────────────────────────────────
    markedAt: {
      type:    Date,
      default: Date.now,
    },

    // ── Student location when marking attendance ───────────────────────────
    location: {
      lat: {
        type:    Number,
        default: null,
      },
      lng: {
        type:    Number,
        default: null,
      },
      accuracy: {
        type:    Number,   // GPS accuracy in metres
        default: null,
      },
    },

    // ── Geofence result ────────────────────────────────────────────────────
    isWithinGeofence: {
      type:    Boolean,
      default: null,    // null = geofence not checked
    },

    distanceFromClass: {
      type:    Number,   // metres from class location
      default: null,
    },

    // ── Device info ────────────────────────────────────────────────────────
    deviceInfo: {
      userAgent: { type: String, default: "" },
      platform:  { type: String, default: "" },
      isMobile:  { type: Boolean, default: false },
    },

    // ── QR token used (for audit trail) ───────────────────────────────────
    qrToken: {
      type:  String,
      default: "",
    },

    // ── Validity flag ──────────────────────────────────────────────────────
    isValid: {
      type:    Boolean,
      default: true,   // set false if marked fraudulently
    },

    // ── Manual override (teacher can edit) ────────────────────────────────
    isManualOverride: {
      type:    Boolean,
      default: false,
    },

    overrideReason: {
      type:  String,
      trim:  true,
      default: "",
    },

    overrideBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    },

    // Anti-proxy fields
    isSuspicious: { type: Boolean, default: false },
    riskScore:    { type: Number,  default: 0      },
    suspiciousFlags: { type: Array, default: []    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound unique index: one attendance per student per session ─────────────
attendanceSchema.index(
  { sessionId: 1, studentId: 1 },
  { unique: true, name: "unique_session_student" }
);

// ─── Additional indexes ───────────────────────────────────────────────────────
attendanceSchema.index({ studentId: 1, courseId:  1 });          // student course history
attendanceSchema.index({ courseId:  1, markedAt: -1 });          // course attendance log
attendanceSchema.index({ sessionId: 1 });                        // all records for session
attendanceSchema.index({ studentId: 1, markedAt: -1 });          // student recent attendance
attendanceSchema.index({ courseId:  1, studentId: 1 });          // student in course
attendanceSchema.index({ teacherId: 1, markedAt: -1 });          // teacher's records

// ─── Static: get attendance % for a student in a course ──────────────────────
attendanceSchema.statics.getStudentCoursePercentage = async function (studentId, courseId) {
  const total   = await this.countDocuments({ studentId, courseId, isValid: true });
  const present = await this.countDocuments({
    studentId, courseId, isValid: true,
    status: { $in: ["present", "late"] },
  });
  return total > 0 ? Math.round((present / total) * 100) : 0;
};

// ─── Static: get full attendance summary for a course ────────────────────────
attendanceSchema.statics.getCourseSummary = async function (courseId) {
  return this.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId), isValid: true } },
    {
      $group: {
        _id:     "$studentId",
        total:   { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } },
        absent:  { $sum: { $cond: [{ $eq:  ["$status",  "absent"]           }, 1, 0] } },
        late:    { $sum: { $cond: [{ $eq:  ["$status",  "late"]             }, 1, 0] } },
      },
    },
    {
      $addFields: {
        percentage: {
          $cond: [
            { $gt: ["$total", 0] },
            { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 0] },
            0,
          ],
        },
      },
    },
  ]);
};

// ─── Static: get session attendance summary ───────────────────────────────────
attendanceSchema.statics.getSessionSummary = async function (sessionId) {
  const records = await this.find({ sessionId, isValid: true })
    .populate("studentId", "name email universityId");

  const summary = {
    total:   records.length,
    present: records.filter(r => r.status === "present").length,
    absent:  records.filter(r => r.status === "absent").length,
    late:    records.filter(r => r.status === "late").length,
    records,
  };
  summary.percentage = summary.total > 0
    ? Math.round(((summary.present + summary.late) / summary.total) * 100)
    : 0;
  return summary;
};

module.exports = mongoose.model("Attendance", attendanceSchema);