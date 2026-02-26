// ─── middleware/roleCheck.js ───────────────────────────────────────────────────

/**
 * authorizeRoles(...roles)
 *
 * Middleware factory — restricts route access to specified roles.
 * Must be used AFTER the `protect` middleware (requires req.user).
 *
 * Usage:
 *   router.get("/admin", protect, authorizeRoles("admin"), handler)
 *   router.get("/staff", protect, authorizeRoles("admin", "teacher"), handler)
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized — no user found",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied — requires role: ${roles.join(" or ")}`,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };