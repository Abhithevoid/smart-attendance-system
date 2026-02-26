const { body, validationResult } = require("express-validator");
const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");

const router = express.Router();

// Reusable validation error handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return first error as "message" so frontend can display it
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name")
      .notEmpty().withMessage("Name is required"),

    body("email")
      .isEmail().withMessage("Please provide a valid email"),

    body("password")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

    body("universityId")
      .notEmpty().withMessage("University ID is required")
      .isLength({ min: 3 }).withMessage("University ID is too short"),
  ],
  handleValidation,
  registerUser
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email")
      .isEmail().withMessage("Please provide a valid email"),

    body("password")
      .notEmpty().withMessage("Password is required"),
  ],
  handleValidation,
  loginUser
);

module.exports = router;