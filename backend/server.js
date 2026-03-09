const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const dotenv     = require("dotenv");

dotenv.config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Database connection ──────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected:", mongoose.connection.host))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes        = require("./routes/auth");
const userRoutes        = require("./routes/user");
const courseRoutes      = require("./routes/course");
const enrollmentRoutes  = require("./routes/enrollment");
const sessionRoutes     = require("./routes/session");
const classroomRoutes   = require("./routes/classroom");
const attendanceRoutes  = require("./routes/attendance");

app.use("/api/auth",        authRoutes);
app.use("/api/user",        userRoutes);
app.use("/api/course",      courseRoutes);
app.use("/api/enrollment",  enrollmentRoutes);
app.use("/api/session",     sessionRoutes);
app.use("/api/classroom",   classroomRoutes);
app.use("/api/attendance",  attendanceRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    mongodb:   mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("💥 Unhandled Error:", err.stack);
  res.status(500).json({
    message: "Internal server error",
    error:   process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});