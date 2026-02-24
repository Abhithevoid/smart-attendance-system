// Role-based authorization middleware

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user comes from protect middleware
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient permissions",
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
