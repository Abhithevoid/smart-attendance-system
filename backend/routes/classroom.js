const express = require("express");
const router  = express.Router();
const { body, validationResult } = require("express-validator");

const { protect }        = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roleCheck");

const {
  createClassroom,
  getAllClassrooms,
  getClassroomsDropdown,
  getClassroomById,
  updateClassroom,
  deleteClassroom,
  toggleClassroomStatus,
  seedClassrooms,
} = require("../controllers/classroomController");

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

// ─── Create validation rules ──────────────────────────────────────────────────
const createRules = [
  body("name")
    .notEmpty().withMessage("Classroom name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters"),
  body("code")
    .notEmpty().withMessage("Classroom code is required")
    .matches(/^[A-Za-z0-9\-]{2,20}$/).withMessage("Code must be alphanumeric with hyphens (e.g. CSB-LAB1)"),
  body("building")
    .notEmpty().withMessage("Building name is required"),
  body("coordinates.lat")
    .optional()
    .isFloat({ min: -90,  max: 90  }).withMessage("Latitude must be between -90 and 90"),
  body("coordinates.lng")
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
  body("radius")
    .optional()
    .isInt({ min: 10, max: 1000 }).withMessage("Radius must be between 10 and 1000 metres"),
  body("capacity")
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage("Capacity must be between 1 and 1000"),
];

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// GET  /api/classroom/dropdown  → for select inputs (all authenticated)
router.get("/dropdown",  protect, getClassroomsDropdown);

// GET  /api/classroom/all       → all classrooms with filters
router.get("/all",       protect, getAllClassrooms);

// POST /api/classroom/seed      → seed defaults into DB (admin only)
router.post("/seed",     protect, authorizeRoles("admin"), seedClassrooms);

// POST /api/classroom           → create classroom (admin only)
router.post("/",
  protect,
  authorizeRoles("admin"),
  createRules,
  handleValidation,
  createClassroom
);

// GET  /api/classroom/:id       → single classroom
router.get("/:id",       protect, getClassroomById);

// PUT  /api/classroom/:id       → update classroom (admin only)
router.put("/:id",       protect, authorizeRoles("admin"), updateClassroom);

// PATCH /api/classroom/:id/toggle → toggle active/inactive (admin only)
router.patch("/:id/toggle", protect, authorizeRoles("admin"), toggleClassroomStatus);

// DELETE /api/classroom/:id     → delete classroom (admin only)
router.delete("/:id",    protect, authorizeRoles("admin"), deleteClassroom);

module.exports = router;