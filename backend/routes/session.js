const express = require("express");
const router  = express.Router();
const { body, validationResult } = require("express-validator");

const { protect }        = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roleCheck");

const {
  createSession,
  getActiveSessions,
  getSessionById,
  getCourseSessions,
  regenerateQR,
  generateQR,
  validateQR,
  endSession,
  cancelSession,
  getTeacherTodaySessions,
} = require("../controllers/sessionController");

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

// ── GET  /api/session/active            → all active sessions
router.get("/active",
  protect,
  authorizeRoles("admin", "teacher", "student"),
  getActiveSessions
);

// ── GET  /api/session/teacher/today     → teacher's today sessions
router.get("/teacher/today",
  protect,
  authorizeRoles("admin", "teacher"),
  getTeacherTodaySessions
);

// ── GET  /api/session/course/:courseId  → all sessions for a course
router.get("/course/:courseId",
  protect,
  authorizeRoles("admin", "teacher"),
  getCourseSessions
);

// ── POST /api/session/create            → create new session + QR
router.post("/create",
  protect,
  authorizeRoles("admin", "teacher"),
  [
    body("courseId")
      .notEmpty().withMessage("Course ID is required")
      .isMongoId().withMessage("Invalid course ID"),
    body("qrDuration")
      .optional()
      .isInt({ min: 1, max: 60 }).withMessage("QR duration must be 1–60 minutes"),
  ],
  handleValidation,
  createSession
);

// ── GET  /api/session/:id               → get session by ID
router.get("/:id",
  protect,
  getSessionById
);

// ── POST /api/session/validate-qr           → validate scanned QR code
router.post("/validate-qr",
  protect,
  [
    body("qrCode")
      .notEmpty().withMessage("QR code is required"),
  ],
  handleValidation,
  validateQR
);

// ── POST /api/session/:id/generate-qr       → generate QR for session
router.post("/:id/generate-qr",
  protect,
  authorizeRoles("admin", "teacher"),
  [
    body("qrDuration")
      .optional()
      .isInt({ min: 1, max: 60 }).withMessage("QR duration must be 1–60 minutes"),
  ],
  handleValidation,
  generateQR
);

// ── POST /api/session/:id/regenerate-qr     → regenerate existing QR
router.post("/:id/regenerate-qr",
  protect,
  authorizeRoles("admin", "teacher"),
  [
    body("qrDuration")
      .optional()
      .isInt({ min: 1, max: 60 }).withMessage("QR duration must be 1–60 minutes"),
  ],
  handleValidation,
  regenerateQR
);

// ── PATCH /api/session/:id/end          → end session manually
router.patch("/:id/end",
  protect,
  authorizeRoles("admin", "teacher"),
  endSession
);

// ── DELETE /api/session/:id             → cancel session
router.delete("/:id",
  protect,
  authorizeRoles("admin", "teacher"),
  cancelSession
);

module.exports = router;