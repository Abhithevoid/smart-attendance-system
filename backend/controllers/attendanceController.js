const Attendance = require("../models/Attendance");
const Session    = require("../models/Session");
const Enrollment = require("../models/Enrollment");
const { validateQRCode }       = require("../utils/qrValidator");
const { verifyStudentLocation } = require("../utils/geofencing");

// ─── Helper: extract device info from request ─────────────────────────────────
const extractDeviceInfo = (req) => {
  const ua       = req.headers["user-agent"] || "";
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  return {
    userAgent: ua.slice(0, 300),
    platform:  isMobile ? "mobile" : "desktop",
    isMobile,
    ip: req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "",
  };
};

// ─── Helper: check for suspicious patterns ───────────────────────────────────
const checkSuspiciousPatterns = async ({ sessionId, studentId, studentLat, studentLng, deviceInfo }) => {
  const flags   = [];
  let riskScore = 0;

  try {
    const existingRecords = await Attendance.find({ sessionId, isValid: true })
      .select("studentId location deviceInfo markedAt");

    // ── Check 1: Same exact GPS coordinates as another student ───────────────
    if (studentLat !== null && studentLng !== null) {
      const sameLocation = existingRecords.filter(r => {
        if (!r.location?.lat || !r.location?.lng) return false;
        const latDiff = Math.abs(r.location.lat - parseFloat(studentLat));
        const lngDiff = Math.abs(r.location.lng - parseFloat(studentLng));
        return latDiff < 0.000001 && lngDiff < 0.000001; // within ~0.1m
      });

      if (sameLocation.length > 0) {
        flags.push({
          type:        "IDENTICAL_LOCATION",
          severity:    "high",
          description: `Exact GPS coordinates match ${sameLocation.length} other student(s) — possible location sharing`,
        });
        riskScore += 40;
      }
    }

    // ── Check 2: Same IP address as another student ──────────────────────────
    if (deviceInfo.ip) {
      const sameIP = existingRecords.filter(r =>
        r.deviceInfo?.ip &&
        r.deviceInfo.ip === deviceInfo.ip &&
        r.studentId.toString() !== studentId.toString()
      );

      if (sameIP.length > 0) {
        flags.push({
          type:        "SAME_IP_ADDRESS",
          severity:    "medium",
          description: `IP address matches ${sameIP.length} other student(s) — possible proxy/VPN`,
        });
        riskScore += 25;
      }
    }

    // ── Check 3: Same user agent as another student ──────────────────────────
    if (deviceInfo.userAgent) {
      const sameUA = existingRecords.filter(r =>
        r.deviceInfo?.userAgent &&
        r.deviceInfo.userAgent === deviceInfo.userAgent &&
        r.studentId.toString() !== studentId.toString()
      );

      if (sameUA.length >= 3) {
        flags.push({
          type:        "SAME_DEVICE_MULTIPLE_STUDENTS",
          severity:    "high",
          description: `Same device used by ${sameUA.length + 1} different students`,
        });
        riskScore += 35;
      }
    }

    // ── Check 4: Marked very quickly after session started ───────────────────
    const session = await Session.findById(sessionId).select("createdAt");
    if (session) {
      const secondsSinceCreated = (Date.now() - new Date(session.createdAt)) / 1000;
      if (secondsSinceCreated < 5) {
        flags.push({
          type:        "TOO_FAST",
          severity:    "low",
          description: "Attendance marked within 5 seconds of session creation",
        });
        riskScore += 10;
      }
    }

  } catch (err) {
    console.error("suspiciousCheck error:", err.message);
  }

  return {
    isSuspicious: riskScore >= 40,
    riskScore,
    flags,
  };
};

// ─── POST /api/attendance/mark ────────────────────────────────────────────────
// @desc   Student marks their own attendance by scanning QR code
// @access Student only
const markAttendance = async (req, res) => {
  try {
    const {
      qrCode,
      studentLat      = null,
      studentLng      = null,
      studentAccuracy = null,
    } = req.body;

    const studentId  = req.user._id;
    const deviceInfo = extractDeviceInfo(req);

    // ── Step 1: Validate QR code + signature + expiry + enrollment ────────────
    const qrResult = await validateQRCode(qrCode, studentId);
    if (!qrResult.valid) {
      return res.status(400).json({
        success: false,
        message: qrResult.reason,
        code:    qrResult.code,
      });
    }

    const { session, course } = qrResult;

    // ── Step 2: Prevent duplicate attendance ──────────────────────────────────
    const existing = await Attendance.findOne({
      sessionId: session._id,
      studentId,
    });

    if (existing) {
      return res.status(400).json({
        success:   false,
        message:   "You have already marked attendance for this session",
        code:      "ALREADY_MARKED",
        markedAt:  existing.markedAt,
        status:    existing.status,
      });
    }

    // ── Step 3: Geofence check ─────────────────────────────────────────────────
    const geoResult = verifyStudentLocation({
      studentLat,
      studentLng,
      studentAccuracy,
      session,
      studentId: studentId.toString(),
    });

    if (!geoResult.isWithin && !geoResult.skipped) {
      return res.status(400).json({
        success:          false,
        message:          geoResult.reason,
        code:             "OUTSIDE_GEOFENCE",
        distance:         geoResult.distance,
        allowedRadius:    geoResult.radius,
        directionToClass: geoResult.directionToClass,
        signalQuality:    geoResult.signal?.label || null,
      });
    }

    // ── Step 4: Determine status (present vs late) ────────────────────────────
    // If student marks > 15 min after session start → late
    let attendanceStatus = "present";
    if (session.startTime) {
      const [hours, minutes] = session.startTime.split(":").map(Number);
      const sessionStart     = new Date(session.date);
      sessionStart.setHours(hours, minutes, 0, 0);
      const minutesLate = (Date.now() - sessionStart) / 60000;
      if (minutesLate > 15) attendanceStatus = "late";
    }

    // ── Step 5: Anti-proxy check ──────────────────────────────────────────────
    const suspiciousResult = await checkSuspiciousPatterns({
      sessionId:  session._id,
      studentId,
      studentLat,
      studentLng,
      deviceInfo,
    });

    // ── Step 6: Save attendance record ────────────────────────────────────────
    const attendance = await Attendance.create({
      sessionId:  session._id,
      courseId:   course._id,
      studentId,
      teacherId:  session.teacherId?._id || qrResult.decoded.teacherId,
      status:     attendanceStatus,
      markedAt:   new Date(),
      location: {
        lat:      studentLat      !== null ? parseFloat(studentLat)      : null,
        lng:      studentLng      !== null ? parseFloat(studentLng)      : null,
        accuracy: studentAccuracy !== null ? parseFloat(studentAccuracy) : null,
      },
      isWithinGeofence:  geoResult.isWithin || geoResult.skipped,
      distanceFromClass: geoResult.distance || null,
      deviceInfo: {
        userAgent: deviceInfo.userAgent,
        platform:  deviceInfo.platform,
        isMobile:  deviceInfo.isMobile,
        ip:        deviceInfo.ip,
      },
      qrToken:       qrCode.slice(0, 50),   // store partial token for audit
      isValid:       !suspiciousResult.isSuspicious,
      isSuspicious:  suspiciousResult.isSuspicious,
      suspiciousFlags: suspiciousResult.flags,
      riskScore:     suspiciousResult.riskScore,
    });

    // ── Step 7: Update session counters ───────────────────────────────────────
    const updateField = attendanceStatus === "late" ? "lateCount" : "presentCount";
    await Session.findByIdAndUpdate(session._id, {
      $inc: { [updateField]: 1 },
    });

    // ── Step 8: Build response ────────────────────────────────────────────────
    const response = {
      success:    true,
      message:    attendanceStatus === "late"
        ? "Attendance marked — you are late"
        : "Attendance marked successfully!",
      attendance: {
        _id:      attendance._id,
        status:   attendance.status,
        markedAt: attendance.markedAt,
        course:   { name: course.name, code: course.code },
        geofence: {
          isWithin:  geoResult.isWithin || geoResult.skipped,
          distance:  geoResult.distance,
          skipped:   geoResult.skipped,
        },
      },
    };

    // Warn student if suspicious but still allowed
    if (suspiciousResult.isSuspicious) {
      response.warning = "Your attendance has been flagged for review";
    }

    return res.status(201).json(response);

  } catch (error) {
    console.error("markAttendance error:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already marked attendance for this session",
        code:    "ALREADY_MARKED",
      });
    }
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─── GET /api/attendance/session/:sessionId ───────────────────────────────────
// @desc   Get all attendance records for a session
// @access Teacher (own), Admin
const getSessionAttendance = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (req.user.role === "teacher" &&
        session.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const records = await Attendance.find({ sessionId: req.params.sessionId })
      .populate("studentId", "name email universityId department")
      .sort({ markedAt: 1 });

    const summary = {
      total:      records.length,
      present:    records.filter(r => r.status === "present").length,
      late:       records.filter(r => r.status === "late").length,
      suspicious: records.filter(r => r.isSuspicious).length,
      percentage: session.totalStudents > 0
        ? Math.round((records.length / session.totalStudents) * 100) : 0,
    };

    return res.json({ records, summary, totalEnrolled: session.totalStudents });
  } catch (error) {
    console.error("getSessionAttendance error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/attendance/student/my-attendance ────────────────────────────────
// @desc   Get logged-in student's full attendance history
// @access Student
const getMyAttendance = async (req, res) => {
  try {
    const { courseId, page = 1, limit = 20 } = req.query;
    const query = { studentId: req.user._id };
    if (courseId) query.courseId = courseId;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate("courseId",  "name code department")
        .populate("sessionId", "date startTime endTime location")
        .sort({ markedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Attendance.countDocuments(query),
    ]);

    return res.json({
      records,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error("getMyAttendance error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/attendance/student/:studentId/course/:courseId ──────────────────
// @desc   Get a student's attendance for a specific course
// @access Admin, Teacher, Student (own only)
const getStudentCourseAttendance = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    if (req.user.role === "student" &&
        req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const records = await Attendance.find({ studentId, courseId, isValid: true })
      .populate("sessionId", "date startTime endTime")
      .sort({ markedAt: -1 });

    const total   = records.length;
    const present = records.filter(r => ["present", "late"].includes(r.status)).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return res.json({
      records,
      stats: { total, present, absent: total - present, percentage },
    });
  } catch (error) {
    console.error("getStudentCourseAttendance error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/attendance/suspicious ──────────────────────────────────────────
// @desc   Get all suspicious attendance records for admin review
// @access Admin only
const getSuspiciousAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [records, total] = await Promise.all([
      Attendance.find({ isSuspicious: true })
        .populate("studentId", "name email universityId")
        .populate("courseId",  "name code")
        .populate("sessionId", "date startTime")
        .sort({ markedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Attendance.countDocuments({ isSuspicious: true }),
    ]);

    return res.json({
      records,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error("getSuspiciousAttendance error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── PATCH /api/attendance/:id/override ──────────────────────────────────────
// @desc   Admin/Teacher manually overrides attendance status
// @access Admin, Teacher
const overrideAttendance = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!["present", "absent", "late", "excused"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Attendance record not found" });

    record.status           = status;
    record.isManualOverride = true;
    record.overrideReason   = reason || "Manual override by admin/teacher";
    record.overrideBy       = req.user._id;
    record.isValid          = true;
    record.isSuspicious     = false;
    await record.save();

    return res.json({
      message: "Attendance overridden successfully",
      record:  { _id: record._id, status: record.status, isManualOverride: true },
    });
  } catch (error) {
    console.error("overrideAttendance error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/attendance/course/:courseId/summary ─────────────────────────────
// @desc   Get full attendance summary for a course
// @access Admin, Teacher
const getCourseSummary = async (req, res) => {
  try {
    const { courseId } = req.params;

    const summaryData = await Attendance.getCourseSummary(courseId);

    // Populate student info
    const User = require("../models/User");
    const populated = await Promise.all(
      summaryData.map(async (s) => {
        const student = await User.findById(s._id).select("name email universityId");
        return { ...s, student };
      })
    );

    return res.json({ summary: populated, total: populated.length });
  } catch (error) {
    console.error("getCourseSummary error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  markAttendance,
  getSessionAttendance,
  getMyAttendance,
  getStudentCourseAttendance,
  getSuspiciousAttendance,
  overrideAttendance,
  getCourseSummary,
};