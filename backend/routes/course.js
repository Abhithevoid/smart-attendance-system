const express = require("express");
const router  = express.Router();
const { body, validationResult } = require("express-validator");

const { protect }        = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roleCheck");

const {
  createCourse,
  getAllCourses,
  getCourseById,
  getTeacherCourses,
  getStudentEnrolledCourses,
  updateCourse,
  deleteCourse,
  toggleCourseStatus,
  getCourseStats,
} = require("../controllers/courseController");

// ─── Validation handler ───────────────────────────────────────────────────────
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors:  errors.array(),
    });
  }
  next();
};

// ─── Create course validation ─────────────────────────────────────────────────
const createCourseRules = [
  body("name")
    .notEmpty().withMessage("Course name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),

  body("code")
    .notEmpty().withMessage("Course code is required")
    .matches(/^[A-Za-z]{2,6}[0-9]{2,4}$/).withMessage("Code must be letters then numbers (e.g. CS201)"),

  body("teacherId")
    .notEmpty().withMessage("Teacher ID is required")
    .isMongoId().withMessage("Invalid teacher ID"),

  body("credits")
    .optional()
    .isInt({ min: 1, max: 6 }).withMessage("Credits must be between 1 and 6"),

  body("semester")
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage("Semester must be between 1 and 8"),
];

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// GET  /api/course/stats              → course statistics (admin)
router.get("/stats",
  protect,
  authorizeRoles("admin"),
  getCourseStats
);

// GET  /api/course/teacher/my-courses → teacher's own courses
router.get("/teacher/my-courses",
  protect,
  authorizeRoles("admin", "teacher"),
  getTeacherCourses
);

// GET  /api/course/student/my-courses → student's enrolled courses
router.get("/student/my-courses",
  protect,
  authorizeRoles("student"),
  getStudentEnrolledCourses
);

// GET  /api/course/all                → all courses (admin + teacher)
router.get("/all",
  protect,
  authorizeRoles("admin", "teacher"),
  getAllCourses
);

// POST /api/course                    → create course (admin only)
router.post("/",
  protect,
  authorizeRoles("admin"),
  createCourseRules,
  handleValidation,
  createCourse
);

// GET  /api/course/:id                → single course
router.get("/:id",
  protect,
  getCourseById
);

// PUT  /api/course/:id                → update course (admin + teacher owner)
router.put("/:id",
  protect,
  authorizeRoles("admin", "teacher"),
  updateCourse
);

// DELETE /api/course/:id              → delete course (admin only)
router.delete("/:id",
  protect,
  authorizeRoles("admin"),
  deleteCourse
);

// PATCH /api/course/:id/toggle        → toggle active/inactive (admin)
router.patch("/:id/toggle",
  protect,
  authorizeRoles("admin"),
  toggleCourseStatus
);

module.exports = router;