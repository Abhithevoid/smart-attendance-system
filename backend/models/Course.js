const mongoose = require("mongoose");

// ─── Schedule Sub-Schema ──────────────────────────────────────────────────────
const scheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: [true, "Day is required"],
      enum: {
        values: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        message: "Invalid day — must be a valid weekday",
      },
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in HH:MM format"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in HH:MM format"],
    },
    location: {
      type: String,
      trim: true,
      default: "",  // e.g. "Room 201", "Lab 3"
    },
  },
  { _id: false }
);

// ─── Location Coordinates Sub-Schema ─────────────────────────────────────────
const locationCoordinatesSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      min:  [-90,  "Latitude must be between -90 and 90"],
      max:  [90,   "Latitude must be between -90 and 90"],
    },
    lng: {
      type: Number,
      min:  [-180, "Longitude must be between -180 and 180"],
      max:  [180,  "Longitude must be between -180 and 180"],
    },
    radius: {
      type:    Number,
      default: 100,   // metres — students must be within this radius to mark attendance
      min:     [10,  "Radius must be at least 10 metres"],
      max:     [1000, "Radius cannot exceed 1000 metres"],
    },
  },
  { _id: false }
);

// ─── Main Course Schema ───────────────────────────────────────────────────────
const courseSchema = new mongoose.Schema(
  {
    // ── Basic info ─────────────────────────────────────────────────────────
    name: {
      type:     String,
      required: [true, "Course name is required"],
      trim:     true,
      minlength: [2,   "Course name must be at least 2 characters"],
      maxlength: [100, "Course name cannot exceed 100 characters"],
    },

    code: {
      type:      String,
      required:  [true, "Course code is required"],
      unique:    true,
      uppercase: true,
      trim:      true,
      match:     [/^[A-Z]{2,6}[0-9]{2,4}$/, "Course code must be letters followed by numbers (e.g. CS201)"],
    },

    description: {
      type:      String,
      trim:      true,
      default:   "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // ── Teacher ────────────────────────────────────────────────────────────
    teacherId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "Teacher is required"],
    },

    // ── Academic info ──────────────────────────────────────────────────────
    department: {
      type:  String,
      trim:  true,
      default: "",
    },

    semester: {
      type: Number,
      min:  [1, "Semester must be between 1 and 8"],
      max:  [8, "Semester must be between 1 and 8"],
    },

    credits: {
      type:    Number,
      default: 3,
      min:     [1, "Credits must be at least 1"],
      max:     [6, "Credits cannot exceed 6"],
    },

    academicYear: {
      type:  String,
      trim:  true,
      default: "",   // e.g. "2024-25"
    },

    // ── Schedule ───────────────────────────────────────────────────────────
    schedule: {
      type:    [scheduleSchema],
      default: [],
    },

    // ── Geofencing ─────────────────────────────────────────────────────────
    locationCoordinates: {
      type:    locationCoordinatesSchema,
      default: () => ({ lat: null, lng: null, radius: 100 }),
    },

    // ── Enrolled students ──────────────────────────────────────────────────
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  "User",
      },
    ],

    // ── Status ─────────────────────────────────────────────────────────────
    isActive: {
      type:    Boolean,
      default: true,
    },

    totalSessions: {
      type:    Number,
      default: 0,   // incremented each time a session is created
    },
  },
  {
    timestamps: true,   // auto createdAt + updatedAt
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
courseSchema.index({ code:       1 });            // fast lookup by course code
courseSchema.index({ teacherId:  1 });            // fast lookup by teacher
courseSchema.index({ department: 1 });            // filter by department
courseSchema.index({ isActive:   1 });            // filter active courses
courseSchema.index({ teacherId:  1, isActive: 1 }); // teacher's active courses

// ─── Virtual: enrolled count ──────────────────────────────────────────────────
courseSchema.virtual("enrolledCount").get(function () {
  return this.enrolledStudents?.length || 0;
});

// ─── Instance method: check if student is enrolled ────────────────────────────
courseSchema.methods.isStudentEnrolled = function (studentId) {
  return this.enrolledStudents.some(
    (id) => id.toString() === studentId.toString()
  );
};

// ─── Instance method: public JSON ─────────────────────────────────────────────
courseSchema.methods.toPublicJSON = function () {
  return {
    _id:                this._id,
    name:               this.name,
    code:               this.code,
    description:        this.description,
    teacherId:          this.teacherId,
    department:         this.department,
    semester:           this.semester,
    credits:            this.credits,
    academicYear:       this.academicYear,
    schedule:           this.schedule,
    locationCoordinates: this.locationCoordinates,
    enrolledCount:      this.enrolledCount,
    totalSessions:      this.totalSessions,
    isActive:           this.isActive,
    createdAt:          this.createdAt,
    updatedAt:          this.updatedAt,
  };
};

module.exports = mongoose.model("Course", courseSchema);