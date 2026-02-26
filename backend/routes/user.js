const express = require("express");
const router  = express.Router();
const { body, validationResult } = require("express-validator");

const { protect }        = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/roleCheck");

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
} = require("../controllers/userController");

// ─── Reusable validation handler ──────────────────────────────────────────────
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

// ─── Update user validation rules ─────────────────────────────────────────────
const updateUserRules = [
  body("name")
    .optional()
    .notEmpty().withMessage("Name cannot be empty")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),

  body("email")
    .optional()
    .isEmail().withMessage("Invalid email address"),

  body("role")
    .optional()
    .isIn(["student", "teacher", "admin"]).withMessage("Invalid role"),

  body("phone")
    .optional()
    .matches(/^[+]?[\d\s\-()]{7,15}$/).withMessage("Invalid phone number"),
];

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC (authenticated) routes
// ══════════════════════════════════════════════════════════════════════════════

// GET    /api/user/profile        → own profile
// PUT    /api/user/profile        → update own profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await require("../models/User")
      .findById(req.user._id)
      .select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put(
  "/profile",
  protect,
  updateUserRules,
  handleValidation,
  (req, res, next) => {
    req.params.id = req.user._id.toString();
    next();
  },
  updateUser
);

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN only routes
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/user/stats             → user statistics
router.get(
  "/stats",
  protect,
  authorizeRoles("admin"),
  getUserStats
);

// GET /api/user/all               → get all users (filterable, paginated)
router.get(
  "/all",
  protect,
  authorizeRoles("admin"),
  getAllUsers
);

// GET /api/user/:id               → get single user
router.get(
  "/:id",
  protect,
  authorizeRoles("admin"),
  getUserById
);

// PUT /api/user/:id               → update any user
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateUserRules,
  handleValidation,
  updateUser
);

// DELETE /api/user/:id            → delete user
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteUser
);

// PATCH /api/user/:id/toggle-status → activate / deactivate
router.patch(
  "/:id/toggle-status",
  protect,
  authorizeRoles("admin"),
  toggleUserStatus
);

module.exports = router;