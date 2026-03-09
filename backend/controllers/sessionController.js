const Session    = require("../models/Session");
const Course     = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Attendance = require("../models/Attendance");
const { generateQRData, getQRTimeRemaining } = require("../utils/qrGenerator");

// ─── POST /api/session/create ─────────────────────────────────────────────────
// @desc   Create a new session and generate QR code
// @access Teacher (own courses), Admin
const createSession = async (req, res) => {
  try {
    const {
      courseId,
      date,
      startTime,
      endTime,
      location,
      qrDuration = 10,
      notes      = "",
    } = req.body;

    // 1. Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 2. Teacher can only create sessions for their own courses
    if (
      req.user.role === "teacher" &&
      course.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized — you can only create sessions for your own courses",
      });
    }

    // 3. Validate qrDuration
    const duration = parseInt(qrDuration);
    if (isNaN(duration) || duration < 1 || duration > 60) {
      return res.status(400).json({
        message: "QR duration must be between 1 and 60 minutes",
      });
    }

    // 4. Check for already active session for this course on the SAME DATE
    const sessionDate = date ? new Date(date) : new Date();
    sessionDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(sessionDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingActive = await Session.findOne({
      courseId,
      status: "active",
      date:   { $gte: sessionDate, $lt: nextDay },
    });

    if (existingActive) {
      return res.status(400).json({
        message:   "An active session already exists for this course on this date",
        sessionId: existingActive._id,
      });
    }

    // 5. Calculate QR expiry
    const qrExpiresAt = new Date(Date.now() + duration * 60 * 1000);

    // 6. Get enrolled student count
    const enrolledCount = await Enrollment.countDocuments({
      courseId,
      status: "active",
    });

    // 7. Create session
    const session = await Session.create({
      courseId,
      teacherId:  req.user._id,
      date:       date ? new Date(date) : new Date(),
      startTime:  startTime || new Date().toTimeString().slice(0, 5),
      endTime:    endTime   || "",
      qrExpiry:   qrExpiresAt,
      qrDuration: duration,
      location: {
        name:   location?.name   || course.schedule?.[0]?.location || "",
        lat:    location?.lat    ?? course.locationCoordinates?.lat ?? null,
        lng:    location?.lng    ?? course.locationCoordinates?.lng ?? null,
        radius: location?.radius ?? course.locationCoordinates?.radius ?? 100,
      },
      status:        "active",
      notes,
      totalStudents: enrolledCount,
    });

    // 8. Generate QR data with HMAC signature
    const qrData = generateQRData({
      sessionId:     session._id,
      courseId:      course._id,
      teacherId:     req.user._id,
      expiryMinutes: duration,
    });

    // 9. Save encoded QR token to session
    session.qrCode = qrData.encoded;
    await session.save();

    // 10. Increment course total sessions counter
    await Course.findByIdAndUpdate(courseId, { $inc: { totalSessions: 1 } });

    // 11. Populate and return
    await session.populate("courseId",  "name code department");
    await session.populate("teacherId", "name email");

    return res.status(201).json({
      message: "Session created successfully",
      session: {
        _id:           session._id,
        courseId:      session.courseId,
        teacherId:     session.teacherId,
        date:          session.date,
        startTime:     session.startTime,
        endTime:       session.endTime,
        location:      session.location,
        status:        session.status,
        totalStudents: session.totalStudents,
        qrCode:        session.qrCode,
        qrExpiry:      session.qrExpiry,
        qrDuration:    session.qrDuration,
        timeRemaining: getQRTimeRemaining(session.qrExpiry),
        notes:         session.notes,
        createdAt:     session.createdAt,
      },
    });
  } catch (error) {
    console.error("createSession error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors)[0].message,
      });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/session/active ──────────────────────────────────────────────────
// @desc   Get all currently active sessions
// @access Teacher (own), Admin (all)
const getActiveSessions = async (req, res) => {
  try {
    // Auto-expire old sessions first
    await Session.expireOldSessions();

    const query = { status: "active" };

    if (req.user.role === "teacher") {
      // Teachers only see their own sessions
      query.teacherId = req.user._id;
    } else if (req.user.role === "student") {
      // Students only see sessions for courses they are enrolled in
      const Enrollment = require("../models/Enrollment");
      const enrollments = await Enrollment.find({
        studentId: req.user._id,
        status:    "active",
      }).select("courseId");
      const enrolledCourseIds = enrollments.map(e => e.courseId);
      query.courseId = { $in: enrolledCourseIds };
    }
    // Admins see all

    const sessions = await Session.find(query)
      .populate("courseId",  "name code department")
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    const sessionsWithTimer = sessions.map(s => ({
      ...s.toObject(),
      timeRemaining: getQRTimeRemaining(s.qrExpiry),
      isQRValid:     s.isQRValid(),
    }));

    return res.json({
      sessions: sessionsWithTimer,
      total:    sessionsWithTimer.length,
    });
  } catch (error) {
    console.error("getActiveSessions error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/session/:id ─────────────────────────────────────────────────────
// @desc   Get session by ID
// @access Teacher (own), Admin, Student (no QR)
const getSessionById = async (req, res) => {
  try {
    await Session.expireOldSessions();

    const session = await Session.findById(req.params.id)
      .populate("courseId",  "name code department locationCoordinates")
      .populate("teacherId", "name email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Teachers can only view their own sessions
    if (
      req.user.role === "teacher" &&
      session.teacherId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not authorized to view this session",
      });
    }

    const response = {
      ...session.toObject(),
      timeRemaining: getQRTimeRemaining(session.qrExpiry),
      isQRValid:     session.isQRValid(),
    };

    // Students do not receive the QR code — they scan it
    if (req.user.role === "student") {
      delete response.qrCode;
    }

    return res.json(response);
  } catch (error) {
    console.error("getSessionById error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Session not found" });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/session/course/:courseId ───────────────────────────────────────
// @desc   Get all sessions for a course
// @access Teacher (own), Admin
const getCourseSessions = async (req, res) => {
  try {
    const { courseId }       = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Teachers can only view their own courses
    if (
      req.user.role === "teacher" &&
      course.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const query    = { courseId };
    if (status)    query.status = status;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [sessions, total] = await Promise.all([
      Session.find(query)
             .populate("teacherId", "name email")
             .sort({ date: -1, createdAt: -1 })
             .skip((pageNum - 1) * limitNum)
             .limit(limitNum),
      Session.countDocuments(query),
    ]);

    return res.json({
      sessions,
      pagination: {
        total,
        page:       pageNum,
        limit:      limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("getCourseSessions error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── POST /api/session/:id/regenerate-qr ─────────────────────────────────────
// @desc   Regenerate a new QR code for an existing session
// @access Teacher (own), Admin
const regenerateQR = async (req, res) => {
  try {
    const { qrDuration = 10 } = req.body;
    const duration = parseInt(qrDuration);

    if (isNaN(duration) || duration < 1 || duration > 60) {
      return res.status(400).json({
        message: "QR duration must be between 1 and 60 minutes",
      });
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (
      req.user.role === "teacher" &&
      session.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (session.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot regenerate QR for a cancelled session",
      });
    }

    // Generate brand new QR data
    const qrData = generateQRData({
      sessionId:     session._id,
      courseId:      session.courseId,
      teacherId:     session.teacherId,
      expiryMinutes: duration,
    });

    session.qrCode     = qrData.encoded;
    session.qrExpiry   = qrData.expiresAt;
    session.qrDuration = duration;
    session.status     = "active";
    await session.save();

    return res.json({
      message:       "QR code regenerated successfully",
      qrCode:        session.qrCode,
      qrExpiry:      session.qrExpiry,
      qrDuration:    session.qrDuration,
      timeRemaining: getQRTimeRemaining(session.qrExpiry),
    });
  } catch (error) {
    console.error("regenerateQR error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── PATCH /api/session/:id/end ───────────────────────────────────────────────
// @desc   End/complete a session manually
// @access Teacher (own), Admin
const endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (
      req.user.role === "teacher" &&
      session.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    if (session.status === "cancelled") {
      return res.status(400).json({ message: "Cannot end a cancelled session" });
    }

    session.status  = "completed";
    session.endTime = req.body.endTime || new Date().toTimeString().slice(0, 5);
    await session.save();

    // Get final attendance summary
    const summary = await Attendance.getSessionSummary(session._id);

    return res.json({
      message: "Session ended successfully",
      session: {
        _id:     session._id,
        status:  session.status,
        endTime: session.endTime,
      },
      attendance: {
        total:   summary.total,
        present: summary.present,
        absent:  summary.total - summary.present,
        late:    summary.late,
      },
    });
  } catch (error) {
    console.error("endSession error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── DELETE /api/session/:id ──────────────────────────────────────────────────
// @desc   Cancel a session
// @access Teacher (own), Admin
const cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (
      req.user.role === "teacher" &&
      session.teacherId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (session.status === "cancelled") {
      return res.status(400).json({ message: "Session is already cancelled" });
    }

    session.status = "cancelled";
    await session.save();

    return res.json({ message: "Session cancelled successfully" });
  } catch (error) {
    console.error("cancelSession error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/session/teacher/today ──────────────────────────────────────────
// @desc   Get today's sessions for logged-in teacher
// @access Teacher, Admin
const getTeacherTodaySessions = async (req, res) => {
  try {
    await Session.expireOldSessions();

    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      date: { $gte: today, $lt: tomorrow },
    };

    // Admin sees all, teacher sees own
    if (req.user.role === "teacher") {
      query.teacherId = req.user._id;
    }

    const sessions = await Session.find(query)
      .populate("courseId", "name code department")
      .sort({ startTime: 1 });

    const sessionsWithTimer = sessions.map(s => ({
      ...s.toObject(),
      timeRemaining: getQRTimeRemaining(s.qrExpiry),
      isQRValid:     s.isQRValid(),
    }));

    return res.json({
      sessions: sessionsWithTimer,
      total:    sessionsWithTimer.length,
    });
  } catch (error) {
    console.error("getTeacherTodaySessions error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── POST /api/session/:id/generate-qr ───────────────────────────────────────
// @desc   Generate (or refresh) QR code for an existing session
// @access Teacher (own), Admin
const generateQR = async (req, res) => {
  try {
    const { qrDuration = 10 } = req.body;
    const duration = parseInt(qrDuration);

    if (isNaN(duration) || duration < 1 || duration > 60) {
      return res.status(400).json({
        message: "QR duration must be between 1 and 60 minutes",
      });
    }

    // 1. Find session
    const session = await Session.findById(req.params.id)
      .populate("courseId",  "name code department")
      .populate("teacherId", "name email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // 2. Authorize — teacher must own the session
    if (
      req.user.role === "teacher" &&
      session.teacherId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 3. Cannot generate QR for cancelled sessions
    if (session.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot generate QR for a cancelled session",
      });
    }

    // 4. Generate fresh QR data with new expiry
    const qrData = generateQRData({
      sessionId:     session._id,
      courseId:      session.courseId._id,
      teacherId:     session.teacherId._id,
      expiryMinutes: duration,
    });

    // 5. Save new QR to session + reactivate if expired
    session.qrCode     = qrData.encoded;
    session.qrExpiry   = qrData.expiresAt;
    session.qrDuration = duration;
    if (session.status === "expired") session.status = "active";
    await session.save();

    return res.json({
      message:    "QR code generated successfully",
      sessionId:  session._id,
      course: {
        name: session.courseId.name,
        code: session.courseId.code,
      },
      qrCode:        session.qrCode,      // base64 string → render as QR image on frontend
      qrExpiry:      session.qrExpiry,
      qrDuration:    session.qrDuration,
      timeRemaining: getQRTimeRemaining(session.qrExpiry),
      location:      session.location,
    });
  } catch (error) {
    console.error("generateQR error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Session not found" });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── POST /api/session/validate-qr ───────────────────────────────────────────
// @desc   Validate a scanned QR code (student scans → frontend sends encoded string)
// @access Student, Teacher, Admin
const validateQR = async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: "QR code is required" });
    }

    const { validateQRCode } = require("../utils/qrValidator");

    // Pass studentId so enrollment check runs
    const studentId = req.user.role === "student" ? req.user._id : null;
    const result    = await validateQRCode(qrCode, studentId);

    if (!result.valid) {
      return res.status(400).json({
        valid:   false,
        message: result.reason,
        code:    result.code,
      });
    }

    return res.json({
      valid:   true,
      message: "QR code is valid",
      ...result,
    });
  } catch (error) {
    console.error("validateQR error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createSession,
  getActiveSessions,
  getSessionById,
  getCourseSessions,
  regenerateQR,
  generateQR,
  validateQR,
  endSession,
  cancelSession,
  getTeacherTodaySessions,
};