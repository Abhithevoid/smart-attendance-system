const Enrollment = require("../models/Enrollment");
const Course     = require("../models/Course");
const User       = require("../models/User");

// ─── POST /api/enrollment/enroll ──────────────────────────────────────────────
// @desc   Enroll a student in a course
// @access Admin, or Student (self-enroll)
const enrollStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    // Determine who is being enrolled
    const targetStudentId = req.user.role === "admin" ? studentId : req.user._id;

    // Verify student exists
    const student = await User.findById(targetStudentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (student.role !== "student") {
      return res.status(400).json({ message: "Only students can be enrolled in courses" });
    }

    // Verify course exists and is active
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (!course.isActive) {
      return res.status(400).json({ message: "Cannot enroll in an inactive course" });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ studentId: targetStudentId, courseId });
    if (existing) {
      if (existing.status === "active") {
        return res.status(400).json({ message: "Student is already enrolled in this course" });
      }
      // Re-activate dropped enrollment
      existing.status         = "active";
      existing.enrollmentDate = new Date();
      existing.enrolledBy     = req.user._id;
      await existing.save();

      return res.status(200).json({
        message:    "Enrollment re-activated successfully",
        enrollment: existing,
      });
    }

    // Create new enrollment
    const enrollment = await Enrollment.create({
      studentId:  targetStudentId,
      courseId,
      enrolledBy: req.user._id,
    });

    // Also add to course's enrolledStudents array
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrolledStudents: targetStudentId },
    });

    await enrollment.populate([
      { path: "studentId", select: "name email universityId" },
      { path: "courseId",  select: "name code department"    },
    ]);

    res.status(201).json({
      message:    "Student enrolled successfully",
      enrollment,
    });
  } catch (error) {
    console.error("enrollStudent error:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Student is already enrolled in this course" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── POST /api/enrollment/enroll-bulk ─────────────────────────────────────────
// @desc   Enroll multiple students in a course at once
// @access Admin only
const enrollBulk = async (req, res) => {
  try {
    const { studentIds, courseId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds must be a non-empty array" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const results = { enrolled: [], alreadyEnrolled: [], failed: [] };

    await Promise.all(
      studentIds.map(async (studentId) => {
        try {
          const student = await User.findById(studentId);
          if (!student || student.role !== "student") {
            results.failed.push({ studentId, reason: "Not a valid student" });
            return;
          }

          const existing = await Enrollment.findOne({ studentId, courseId });
          if (existing?.status === "active") {
            results.alreadyEnrolled.push(studentId);
            return;
          }

          if (existing) {
            existing.status = "active";
            await existing.save();
          } else {
            await Enrollment.create({ studentId, courseId, enrolledBy: req.user._id });
          }

          await Course.findByIdAndUpdate(courseId, {
            $addToSet: { enrolledStudents: studentId },
          });

          results.enrolled.push(studentId);
        } catch {
          results.failed.push({ studentId, reason: "Enrollment failed" });
        }
      })
    );

    res.status(201).json({
      message: `Enrolled ${results.enrolled.length} students successfully`,
      results,
    });
  } catch (error) {
    console.error("enrollBulk error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── DELETE /api/enrollment/unenroll ─────────────────────────────────────────
// @desc   Unenroll (drop) a student from a course
// @access Admin, or Student (self-unenroll)
const unenrollStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const targetStudentId = req.user.role === "admin" ? studentId : req.user._id;

    const enrollment = await Enrollment.findOne({
      studentId: targetStudentId,
      courseId,
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    enrollment.status = "dropped";
    await enrollment.save();

    // Remove from course's enrolledStudents array
    await Course.findByIdAndUpdate(courseId, {
      $pull: { enrolledStudents: targetStudentId },
    });

    res.json({ message: "Student unenrolled successfully" });
  } catch (error) {
    console.error("unenrollStudent error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/enrollment/my-courses ──────────────────────────────────────────
// @desc   Get all courses student is enrolled in
// @access Student
const getStudentCourses = async (req, res) => {
  try {
    const studentId = req.user._id;

    const enrollments = await Enrollment.find({ studentId, status: "active" })
      .populate({
        path:     "courseId",
        populate: { path: "teacherId", select: "name email" },
      })
      .sort({ enrollmentDate: -1 });

    const courses = enrollments
      .filter(e => e.courseId)   // guard against deleted courses
      .map(e => ({
        ...e.courseId.toObject(),
        enrollmentId:   e._id,
        enrollmentDate: e.enrollmentDate,
      }));

    res.json({ courses, total: courses.length });
  } catch (error) {
    console.error("getStudentCourses error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/enrollment/course/:courseId/students ───────────────────────────
// @desc   Get all students enrolled in a course
// @access Admin, Teacher
const getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status = "active", search } = req.query;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Teachers can only see their own courses
    if (req.user.role === "teacher" &&
        course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this course" });
    }

    const query = { courseId, status };
    const enrollments = await Enrollment.find(query)
      .populate("studentId", "name email universityId department phone isActive")
      .sort({ enrollmentDate: -1 });

    let students = enrollments
      .filter(e => e.studentId)
      .map(e => ({
        ...e.studentId.toObject(),
        enrollmentId:   e._id,
        enrollmentDate: e.enrollmentDate,
        enrollmentStatus: e.status,
      }));

    // Apply search filter
    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.universityId?.toLowerCase().includes(q)
      );
    }

    res.json({
      course:   { _id: course._id, name: course.name, code: course.code },
      students,
      total:    students.length,
    });
  } catch (error) {
    console.error("getCourseStudents error:", error.message);
    if (error.kind === "ObjectId") return res.status(404).json({ message: "Course not found" });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/enrollment/check ────────────────────────────────────────────────
// @desc   Check if a student is enrolled in a specific course
// @access Any authenticated user
const checkEnrollment = async (req, res) => {
  try {
    const { studentId, courseId } = req.query;
    const targetId = studentId || req.user._id;

    const enrollment = await Enrollment.findOne({
      studentId: targetId,
      courseId,
    });

    res.json({
      isEnrolled: enrollment?.status === "active" || false,
      status:     enrollment?.status || null,
      enrollment: enrollment || null,
    });
  } catch (error) {
    console.error("checkEnrollment error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  enrollStudent,
  enrollBulk,
  unenrollStudent,
  getStudentCourses,
  getCourseStudents,
  checkEnrollment,
};