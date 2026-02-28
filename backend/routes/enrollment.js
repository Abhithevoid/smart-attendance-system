const express = require("express");
const router  = express.Router();
const { body, validationResult } = require("express-validator");

const { protect }        = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roleCheck");

const {
  enrollStudent,
  enrollBulk,
  unenrollStudent,
  getStudentCourses,
  getCourseStudents,
  checkEnrollment,
} = require("../controllers/enrollmentController");

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

// ── GET  /api/enrollment/my-courses               → student's courses
router.get("/my-courses",
  protect,
  authorizeRoles("student"),
  getStudentCourses
);

// ── GET  /api/enrollment/check                    → check enrollment status
router.get("/check",
  protect,
  checkEnrollment
);

// ── GET  /api/enrollment/course/:courseId/students → all students in a course
router.get("/course/:courseId/students",
  protect,
  authorizeRoles("admin", "teacher"),
  getCourseStudents
);

// ── POST /api/enrollment/enroll                   → enroll single student
router.post("/enroll",
  protect,
  authorizeRoles("admin", "student"),
  [
    body("courseId")
      .notEmpty().withMessage("Course ID is required")
      .isMongoId().withMessage("Invalid course ID"),
    body("studentId")
      .if((_, { req }) => req.user?.role === "admin")
      .notEmpty().withMessage("Student ID is required for admin enrollment")
      .isMongoId().withMessage("Invalid student ID"),
  ],
  handleValidation,
  enrollStudent
);

// ── POST /api/enrollment/enroll-bulk              → enroll multiple students
router.post("/enroll-bulk",
  protect,
  authorizeRoles("admin"),
  [
    body("courseId")
      .notEmpty().withMessage("Course ID is required")
      .isMongoId().withMessage("Invalid course ID"),
    body("studentIds")
      .isArray({ min: 1 }).withMessage("studentIds must be a non-empty array"),
  ],
  handleValidation,
  enrollBulk
);

// ── DELETE /api/enrollment/unenroll               → unenroll student
router.delete("/unenroll",
  protect,
  authorizeRoles("admin", "student"),
  [
    body("courseId")
      .notEmpty().withMessage("Course ID is required")
      .isMongoId().withMessage("Invalid course ID"),
  ],
  handleValidation,
  unenrollStudent
);

module.exports = router;