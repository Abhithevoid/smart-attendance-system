const express = require("express");
const router  = express.Router();
const { body, validationResult } = require("express-validator");

const { protect }        = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roleCheck");

const {
  markAttendance,
  getSessionAttendance,
  getMyAttendance,
  getStudentCourseAttendance,
  getSuspiciousAttendance,
  overrideAttendance,
  getCourseSummary,
} = require("../controllers/attendanceController");

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

// ── POST /api/attendance/mark → student marks attendance via QR
router.post("/mark",
  protect,
  authorizeRoles("student"),
  [
    body("qrCode")
      .notEmpty().withMessage("QR code is required"),
    body("studentLat")
      .optional()
      .isFloat({ min: -90,  max: 90  }).withMessage("Invalid latitude"),
    body("studentLng")
      .optional()
      .isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
    body("studentAccuracy")
      .optional()
      .isFloat({ min: 0 }).withMessage("Accuracy must be a positive number"),
  ],
  handleValidation,
  markAttendance
);

// ── GET /api/attendance/my-attendance → student's own history
router.get("/my-attendance",
  protect,
  authorizeRoles("student"),
  getMyAttendance
);

// ── GET /api/attendance/suspicious → flagged records (admin only)
router.get("/suspicious",
  protect,
  authorizeRoles("admin"),
  getSuspiciousAttendance
);

// ── GET /api/attendance/session/:sessionId → all records for a session
router.get("/session/:sessionId",
  protect,
  authorizeRoles("admin", "teacher"),
  getSessionAttendance
);

// ── GET /api/attendance/course/:courseId/summary → course summary
router.get("/course/:courseId/summary",
  protect,
  authorizeRoles("admin", "teacher"),
  getCourseSummary
);

// ── GET /api/attendance/student/:studentId/course/:courseId → student course attendance
router.get("/student/:studentId/course/:courseId",
  protect,
  getStudentCourseAttendance
);

// ── PATCH /api/attendance/:id/override → manual override (admin/teacher)
router.patch("/:id/override",
  protect,
  authorizeRoles("admin", "teacher"),
  [
    body("status")
      .notEmpty().withMessage("Status is required")
      .isIn(["present", "absent", "late", "excused"]).withMessage("Invalid status"),
    body("reason")
      .optional()
      .isLength({ max: 300 }).withMessage("Reason cannot exceed 300 characters"),
  ],
  handleValidation,
  overrideAttendance
);

module.exports = router;