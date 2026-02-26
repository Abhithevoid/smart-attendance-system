const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    universityId: {
      type: String,
      required: [true, "University ID is required"],
      unique: true,
      trim: true,
    },

    role: {
      type: String,
      enum: {
        values: ["student", "teacher", "admin"],
        message: "Role must be student, teacher, or admin",
      },
      default: "student",
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Hash password before saving ──────────────────────────────────────────────
// NOTE: No "next" parameter — Mongoose 7+ handles async hooks automatically
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Compare entered password with hashed password ────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Return user without sensitive fields ─────────────────────────────────────
userSchema.methods.toPublicJSON = function () {
  return {
    _id:          this._id,
    name:         this.name,
    email:        this.email,
    universityId: this.universityId,
    role:         this.role,
    department:   this.department,
    phone:        this.phone,
    isActive:     this.isActive,
    createdAt:    this.createdAt,
    updatedAt:    this.updatedAt,
  };
};

module.exports = mongoose.model("User", userSchema);