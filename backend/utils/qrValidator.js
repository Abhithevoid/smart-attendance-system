const Session    = require("../models/Session");
const Enrollment = require("../models/Enrollment");
const { decodeQRData, getQRTimeRemaining } = require("./qrGenerator");

// ─── Main QR Validator ────────────────────────────────────────────────────────
// Called when a student scans a QR code.
// Returns { valid, reason, session, course, timeRemaining } 
const validateQRCode = async (encoded, studentId = null) => {

  // ── Step 1: Decode & verify signature ─────────────────────────────────────
  const decoded = decodeQRData(encoded);

  if (!decoded.valid) {
    return {
      valid:  false,
      reason: decoded.reason,       // "Invalid QR signature" or "QR code has expired"
      code:   "INVALID_QR",
    };
  }

  // ── Step 2: Check session exists in DB ─────────────────────────────────────
  const session = await Session.findById(decoded.sessionId)
    .populate("courseId",  "name code department locationCoordinates")
    .populate("teacherId", "name email");

  if (!session) {
    return {
      valid:  false,
      reason: "Session not found — QR code may be invalid",
      code:   "SESSION_NOT_FOUND",
    };
  }

  // ── Step 3: Check session is still active ──────────────────────────────────
  if (session.status !== "active") {
    return {
      valid:   false,
      reason:  `Session is ${session.status} — attendance can no longer be marked`,
      code:    "SESSION_INACTIVE",
      session: { _id: session._id, status: session.status },
    };
  }

  // ── Step 4: Check QR expiry via DB record ──────────────────────────────────
  if (!session.isQRValid()) {
    return {
      valid:   false,
      reason:  "QR code has expired — ask your teacher to regenerate",
      code:    "QR_EXPIRED",
      session: { _id: session._id, status: session.status },
    };
  }

  // ── Step 5: Check student enrollment (if studentId provided) ──────────────
  if (studentId) {
    const isEnrolled = await Enrollment.isEnrolled(studentId, session.courseId._id);
    if (!isEnrolled) {
      return {
        valid:   false,
        reason:  "You are not enrolled in this course",
        code:    "NOT_ENROLLED",
        session: { _id: session._id },
        course:  { name: session.courseId.name, code: session.courseId.code },
      };
    }
  }

  // ── Step 6: All checks passed ──────────────────────────────────────────────
  const timeRemaining = getQRTimeRemaining(session.qrExpiry);

  return {
    valid:   true,
    session: {
      _id:          session._id,
      status:       session.status,
      date:         session.date,
      startTime:    session.startTime,
      location:     session.location,
      totalStudents: session.totalStudents,
    },
    course: {
      _id:        session.courseId._id,
      name:       session.courseId.name,
      code:       session.courseId.code,
      department: session.courseId.department,
      locationCoordinates: session.courseId.locationCoordinates,
    },
    teacher: {
      name:  session.teacherId.name,
      email: session.teacherId.email,
    },
    timeRemaining,
    decoded: {
      sessionId: decoded.sessionId,
      courseId:  decoded.courseId,
      teacherId: decoded.teacherId,
      issuedAt:  decoded.issuedAt,
      expiresAt: decoded.expiresAt,
    },
  };
};

// ─── Quick validity check (no DB) ────────────────────────────────────────────
// Use this for a fast pre-check before hitting the DB
const quickValidate = (encoded) => {
  return decodeQRData(encoded);
};

// ─── Validate and return error response ──────────────────────────────────────
// Convenience wrapper for use directly in controllers
const validateAndRespond = async (encoded, studentId, res) => {
  const result = await validateQRCode(encoded, studentId);
  if (!result.valid) {
    res.status(400).json({
      message: result.reason,
      code:    result.code,
    });
    return null;
  }
  return result;
};

module.exports = {
  validateQRCode,
  quickValidate,
  validateAndRespond,
};