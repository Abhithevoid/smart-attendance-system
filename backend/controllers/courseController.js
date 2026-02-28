const Course     = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const User       = require("../models/User");

// ─── POST /api/course ─────────────────────────────────────────────────────────
// @desc   Create a new course
// @access Admin only
const createCourse = async (req, res) => {
  try {
    const {
      name, code, description, teacherId,
      department, semester, credits, academicYear,
      schedule, locationCoordinates,
    } = req.body;

    // Verify teacher exists and has teacher/admin role
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    if (!["teacher", "admin"].includes(teacher.role)) {
      return res.status(400).json({ message: "Assigned user must be a teacher or admin" });
    }

    // Check course code uniqueness
    const existing = await Course.findOne({ code: code?.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: `Course code ${code.toUpperCase()} already exists` });
    }

    const course = await Course.create({
      name, code, description, teacherId,
      department, semester, credits, academicYear,
      schedule:             schedule             || [],
      locationCoordinates:  locationCoordinates  || {},
    });

    // Populate teacher info before returning
    await course.populate("teacherId", "name email universityId");

    res.status(201).json({
      message: "Course created successfully",
      course:  course.toPublicJSON(),
    });
  } catch (error) {
    console.error("createCourse error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: "Course code already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/course/all ──────────────────────────────────────────────────────
// @desc   Get all courses (with filters)
// @access Admin, Teacher
const getAllCourses = async (req, res) => {
  try {
    const {
      department, teacherId, semester,
      search, isActive,
      page = 1, limit = 20,
      sortBy = "createdAt", sortDir = "desc",
    } = req.query;

    const query = {};
    if (department)          query.department = department;
    if (teacherId)           query.teacherId  = teacherId;
    if (semester)            query.semester   = Number(semester);
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: "i" } },
        { code:        { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions  = { [sortBy]: sortDir === "asc" ? 1 : -1 };
    const pageNum      = Math.max(1, parseInt(page));
    const limitNum     = Math.min(100, Math.max(1, parseInt(limit)));
    const skip         = (pageNum - 1) * limitNum;

    const [courses, total] = await Promise.all([
      Course.find(query)
            .populate("teacherId", "name email universityId")
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum),
      Course.countDocuments(query),
    ]);

    res.json({
      courses,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum < Math.ceil(total / limitNum),
        hasPrev:    pageNum > 1,
      },
    });
  } catch (error) {
    console.error("getAllCourses error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/course/:id ──────────────────────────────────────────────────────
// @desc   Get single course by ID
// @access Admin, Teacher, Student
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
                               .populate("teacherId", "name email universityId department");

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Get enrolled student count
    const enrolledCount = await Enrollment.countDocuments({
      courseId: course._id,
      status:   "active",
    });

    res.json({ ...course.toObject(), enrolledCount });
  } catch (error) {
    console.error("getCourseById error:", error.message);
    if (error.kind === "ObjectId") return res.status(404).json({ message: "Course not found" });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/course/teacher/my-courses ───────────────────────────────────────
// @desc   Get all courses assigned to logged-in teacher
// @access Teacher
const getTeacherCourses = async (req, res) => {
  try {
    const { isActive, search } = req.query;

    const query = { teacherId: req.user._id };
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(query)
                                .sort({ createdAt: -1 });

    // Add enrolled count to each course
    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const enrolledCount = await Enrollment.countDocuments({
          courseId: course._id,
          status:   "active",
        });
        return { ...course.toObject(), enrolledCount };
      })
    );

    res.json({ courses: coursesWithCounts, total: coursesWithCounts.length });
  } catch (error) {
    console.error("getTeacherCourses error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/course/student/my-courses ───────────────────────────────────────
// @desc   Get all courses a student is enrolled in
// @access Student
const getStudentEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      studentId: req.user._id,
      status:    "active",
    }).populate({
      path:     "courseId",
      populate: { path: "teacherId", select: "name email" },
    });

    const courses = enrollments.map(e => ({
      ...e.courseId.toObject(),
      enrollmentDate: e.enrollmentDate,
      enrollmentId:   e._id,
    }));

    res.json({ courses, total: courses.length });
  } catch (error) {
    console.error("getStudentEnrolledCourses error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── PUT /api/course/:id ──────────────────────────────────────────────────────
// @desc   Update a course
// @access Admin, or Teacher (own courses only)
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Teachers can only update their own courses
    if (req.user.role === "teacher" &&
        course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this course" });
    }

    const allowed = [
      "name", "description", "department", "semester",
      "credits", "academicYear", "schedule",
      "locationCoordinates", "isActive",
    ];

    // Admin can also reassign teacher
    if (req.user.role === "admin" && req.body.teacherId) {
      const teacher = await User.findById(req.body.teacherId);
      if (!teacher || !["teacher", "admin"].includes(teacher.role)) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      course.teacherId = req.body.teacherId;
    }

    allowed.forEach(field => {
      if (req.body[field] !== undefined) course[field] = req.body[field];
    });

    // Handle code change (admin only)
    if (req.user.role === "admin" && req.body.code) {
      const exists = await Course.findOne({
        code: req.body.code.toUpperCase(),
        _id:  { $ne: req.params.id },
      });
      if (exists) return res.status(400).json({ message: "Course code already in use" });
      course.code = req.body.code.toUpperCase();
    }

    const updated = await course.save();
    await updated.populate("teacherId", "name email universityId");

    res.json({
      message: "Course updated successfully",
      course:  updated.toPublicJSON(),
    });
  } catch (error) {
    console.error("updateCourse error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── DELETE /api/course/:id ───────────────────────────────────────────────────
// @desc   Delete a course (admin only)
// @access Admin
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if students are enrolled
    const enrolledCount = await Enrollment.countDocuments({
      courseId: course._id,
      status:   "active",
    });

    if (enrolledCount > 0) {
      return res.status(400).json({
        message: `Cannot delete course — ${enrolledCount} student(s) still enrolled. Deactivate instead.`,
      });
    }

    await course.deleteOne();

    res.json({
      message:       "Course deleted successfully",
      deletedCourse: { _id: course._id, name: course.name, code: course.code },
    });
  } catch (error) {
    console.error("deleteCourse error:", error.message);
    if (error.kind === "ObjectId") return res.status(404).json({ message: "Course not found" });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── PATCH /api/course/:id/toggle ─────────────────────────────────────────────
// @desc   Toggle course active/inactive
// @access Admin
const toggleCourseStatus = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.isActive = !course.isActive;
    await course.save();

    res.json({
      message: `Course ${course.isActive ? "activated" : "deactivated"} successfully`,
      course:  { _id: course._id, name: course.name, isActive: course.isActive },
    });
  } catch (error) {
    console.error("toggleCourseStatus error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/course/stats ────────────────────────────────────────────────────
// @desc   Get course statistics
// @access Admin
const getCourseStats = async (req, res) => {
  try {
    const [total, active, inactive] = await Promise.all([
      Course.countDocuments(),
      Course.countDocuments({ isActive: true  }),
      Course.countDocuments({ isActive: false }),
    ]);

    // Courses by department
    const byDepartment = await Course.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]);

    res.json({ total, active, inactive, byDepartment });
  } catch (error) {
    console.error("getCourseStats error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  getTeacherCourses,
  getStudentEnrolledCourses,
  updateCourse,
  deleteCourse,
  toggleCourseStatus,
  getCourseStats,
};