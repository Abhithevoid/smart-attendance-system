const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const User = require("../models/User");

// @desc   Get logged-in user profile
// @route  GET /api/user/profile
// @access Private
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Server error while fetching profile",
      error: error.message,
    });
  }
});

// @desc   Update logged-in user profile
// @route  PUT /api/user/profile
// @access Private
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.department = req.body.department || user.department;
      user.phone = req.body.phone || user.phone;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        phone: updatedUser.phone,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error while updating profile",
      error: error.message,
    });
  }
});

module.exports = router;
