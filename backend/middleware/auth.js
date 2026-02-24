const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  try {
    // 1️⃣ Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ If no token
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token provided",
      });
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Get user from DB (remove password)
    req.user = await User.findById(decoded.id).select("-password");

    next(); // allow access
  } catch (error) {
    res.status(401).json({
      message: "Not authorized, token failed or expired",
    });
  }
};

module.exports = { protect };
