const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const { protect } = require("./middleware/auth");
const { authorizeRoles } = require("./middleware/roleCheck");
const userRoutes = require("./routes/user");





const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);


//test route
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You accessed a protected route 🎉",
    user: req.user,
  });
});



app.get("/", (req, res) => {
  res.send("Smart Attendance Backend is running 🚀");
});


app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// Admin-only route
app.get(
  "/api/admin",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Welcome Admin 👑" });
  }
);

// Teacher-only route
app.get(
  "/api/teacher",
  protect,
  authorizeRoles("teacher"),
  (req, res) => {
    res.json({ message: "Welcome Teacher 📚" });
  }
);

// Student-only route
app.get(
  "/api/student",
  protect,
  authorizeRoles("student"),
  (req, res) => {
    res.json({ message: "Welcome Student 🎓" });
  }
);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Add this just before app.listen()
app.use((err, req, res, next) => {
  console.error("💥 Unhandled Error:", err.stack);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
});
