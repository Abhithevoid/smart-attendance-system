const User = require("../models/User");

// ─── GET /api/user/all ─────────────────────────────────────────────────────────
// @desc   Get all users (with optional filters)
// @access Admin only
const getAllUsers = async (req, res) => {
  try {
    const {
      role,         // filter by role: student | teacher | admin
      department,   // filter by department
      search,       // search by name or email
      page    = 1,
      limit   = 20,
      sortBy  = "createdAt",
      sortDir = "desc",
    } = req.query;

    // ── Build query ────────────────────────────────────────────────────────
    const query = {};

    if (role)       query.role       = role;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name:         { $regex: search, $options: "i" } },
        { email:        { $regex: search, $options: "i" } },
        { universityId: { $regex: search, $options: "i" } },
      ];
    }

    // ── Sort ───────────────────────────────────────────────────────────────
    const sortOptions = {};
    sortOptions[sortBy] = sortDir === "asc" ? 1 : -1;

    // ── Pagination ─────────────────────────────────────────────────────────
    const pageNum   = Math.max(1, parseInt(page));
    const limitNum  = Math.min(100, Math.max(1, parseInt(limit)));
    const skip      = (pageNum - 1) * limitNum;

    // ── Execute ────────────────────────────────────────────────────────────
    const [users, total] = await Promise.all([
      User.find(query)
          .select("-password")
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext:    pageNum < Math.ceil(total / limitNum),
        hasPrev:    pageNum > 1,
      },
    });
  } catch (error) {
    console.error("getAllUsers error:", error.message);
    res.status(500).json({
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

// ─── GET /api/user/:id ─────────────────────────────────────────────────────────
// @desc   Get single user by ID
// @access Admin only
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("getUserById error:", error.message);

    // Invalid ObjectId
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(500).json({
      message: "Server error while fetching user",
      error: error.message,
    });
  }
};

// ─── PUT /api/user/:id ─────────────────────────────────────────────────────────
// @desc   Update any user (admin) or own profile (any role)
// @access Admin (any user) | Private (own profile)
// ─── ADD THIS to your userController.js updateUser function ──────────────────
// Replace the existing updateUser function with this version
// It adds support for password change via currentPassword + newPassword

//  const User    = require("../models/User");
const bcrypt  = require("bcryptjs");

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Non-admin users can only update their own profile
    if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        message: "Not authorized to update this user",
      });
    }

    const {
      name, email, department, phone, isActive,
      currentPassword, newPassword,              // ← password change
    } = req.body;

    // ── Handle password change ─────────────────────────────────────────────
    if (currentPassword && newPassword) {
      // Fetch user WITH password for comparison
      const userWithPass = await User.findById(req.params.id);
      const isMatch = await userWithPass.matchPassword(currentPassword);

      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      user.password = newPassword; // pre-save hook will hash it
    }

    // ── Update other fields ────────────────────────────────────────────────
    if (name)       user.name       = name;
    if (email)      user.email      = email;
    if (department !== undefined) user.department = department;
    if (phone      !== undefined) user.phone      = phone;

    // Only admin can change role and isActive
    if (req.user.role === "admin") {
      if (req.body.role && ["student", "teacher", "admin"].includes(req.body.role)) {
        user.role = req.body.role;
      }
      if (isActive !== undefined) user.isActive = isActive;
    }

    // ── Check email uniqueness ─────────────────────────────────────────────
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updatedUser = await user.save();

    res.json({
      message: currentPassword ? "Password updated successfully" : "Profile updated successfully",
      user: {
        _id:          updatedUser._id,
        name:         updatedUser.name,
        email:        updatedUser.email,
        role:         updatedUser.role,
        universityId: updatedUser.universityId,
        department:   updatedUser.department,
        phone:        updatedUser.phone,
        isActive:     updatedUser.isActive,
        updatedAt:    updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("updateUser error:", error.message);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "User not found" });
    }
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)[0].message;
      return res.status(400).json({ message });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        message: `${field === "email" ? "Email" : "University ID"} already in use`,
      });
    }

    res.status(500).json({
      message: "Server error while updating user",
      error: error.message,
    });
  }
};

module.exports = { updateUser };

// ─── DELETE /api/user/:id ──────────────────────────────────────────────────────
// @desc   Delete a user
// @access Admin only
const deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.json({
      message: "User deleted successfully",
      deletedUser: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (error) {
    console.error("deleteUser error:", error.message);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(500).json({
      message: "Server error while deleting user",
      error: error.message,
    });
  }
};

// ─── PATCH /api/user/:id/toggle-status ────────────────────────────────────────
// @desc   Toggle user active/inactive status
// @access Admin only
const toggleUserStatus = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        message: "You cannot deactivate your own account",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user: {
        _id:      user._id,
        name:     user.name,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("toggleUserStatus error:", error.message);
    res.status(500).json({
      message: "Server error while updating user status",
      error: error.message,
    });
  }
};

// ─── GET /api/user/stats ───────────────────────────────────────────────────────
// @desc   Get user statistics (counts by role)
// @access Admin only
const getUserStats = async (req, res) => {
  try {
    const [total, students, teachers, admins, active] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "admin"   }),
      User.countDocuments({ isActive: true  }),
    ]);

    res.json({
      total,
      students,
      teachers,
      admins,
      active,
      inactive: total - active,
    });
  } catch (error) {
    console.error("getUserStats error:", error.message);
    res.status(500).json({
      message: "Server error while fetching stats",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
};