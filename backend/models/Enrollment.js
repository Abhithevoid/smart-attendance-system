const mongoose = require("mongoose");

// ─── Enrollment Schema ────────────────────────────────────────────────────────
const enrollmentSchema = new mongoose.Schema(
  {
    // ── Student ────────────────────────────────────────────────────────────
    studentId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: [true, "Student ID is required"],
    },

    // ── Course ─────────────────────────────────────────────────────────────
    courseId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Course",
      required: [true, "Course ID is required"],
    },

    // ── Enrollment date ────────────────────────────────────────────────────
    enrollmentDate: {
      type:    Date,
      default: Date.now,
    },

    // ── Status ─────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum: {
        values:  ["active", "dropped", "completed", "suspended"],
        message: "Status must be active, dropped, completed, or suspended",
      },
      default: "active",
    },

    // ── Grade (optional — for future use) ──────────────────────────────────
    grade: {
      type:    String,
      default: "",
      trim:    true,
    },

    // ── Enrolled by (admin or self) ────────────────────────────────────────
    enrolledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound unique index: one enrollment per student per course ─────────────
enrollmentSchema.index(
  { studentId: 1, courseId: 1 },
  { unique: true, name: "unique_student_course" }
);

// ─── Additional indexes ───────────────────────────────────────────────────────
enrollmentSchema.index({ studentId: 1 });           // all courses for a student
enrollmentSchema.index({ courseId:  1 });           // all students in a course
enrollmentSchema.index({ status:    1 });           // filter by status
enrollmentSchema.index({ courseId:  1, status: 1 }); // active students in course

// ─── Instance method: is enrollment active ────────────────────────────────────
enrollmentSchema.methods.isActive = function () {
  return this.status === "active";
};

// ─── Static method: check if student is enrolled in course ───────────────────
enrollmentSchema.statics.isEnrolled = async function (studentId, courseId) {
  const enrollment = await this.findOne({
    studentId,
    courseId,
    status: "active",
  });
  return !!enrollment;
};

// ─── Static method: get all active students in a course ──────────────────────
enrollmentSchema.statics.getActiveStudents = async function (courseId) {
  return this.find({ courseId, status: "active" })
             .populate("studentId", "name email universityId department");
};

// ─── Static method: get all active courses for a student ─────────────────────
enrollmentSchema.statics.getStudentCourses = async function (studentId) {
  return this.find({ studentId, status: "active" })
             .populate("courseId");
};

module.exports = mongoose.model("Enrollment", enrollmentSchema);