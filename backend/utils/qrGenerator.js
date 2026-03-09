const crypto = require("crypto");

// ─── Config ───────────────────────────────────────────────────────────────────
const QR_SECRET = process.env.QR_SECRET || "smart-attendance-qr-secret-key-2024";
const DEFAULT_EXPIRY_MINUTES = 10;

// ─── Generate HMAC signature ──────────────────────────────────────────────────
const generateSignature = (payload) => {
  return crypto
    .createHmac("sha256", QR_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
};

// ─── Verify HMAC signature ────────────────────────────────────────────────────
const verifySignature = (payload, signature) => {
  const expected = generateSignature(payload);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
};

// ─── Generate QR data payload ─────────────────────────────────────────────────
// This is the data embedded in the QR code image.
// Students scan this → frontend sends it to backend for verification.
const generateQRData = ({
  sessionId,
  courseId,
  teacherId,
  expiryMinutes = DEFAULT_EXPIRY_MINUTES,
}) => {
  const issuedAt  = Date.now();
  const expiresAt = issuedAt + expiryMinutes * 60 * 1000;

  // Core payload (unsigned)
  const payload = {
    sessionId: sessionId.toString(),
    courseId:  courseId.toString(),
    teacherId: teacherId.toString(),
    issuedAt,
    expiresAt,
    version: "1.0",
  };

  // Sign the payload
  const signature = generateSignature(payload);

  // Final QR data object
  const qrData = { ...payload, signature };

  // Encode as base64 string for compact QR embedding
  const encoded = Buffer.from(JSON.stringify(qrData)).toString("base64");

  return {
    raw:       qrData,     // full object for storage / debugging
    encoded,               // base64 string → goes into QR image
    expiresAt: new Date(expiresAt),
    issuedAt:  new Date(issuedAt),
  };
};

// ─── Decode and verify QR string ──────────────────────────────────────────────
const decodeQRData = (encoded) => {
  try {
    const json    = Buffer.from(encoded, "base64").toString("utf8");
    const qrData  = JSON.parse(json);
    const { signature, ...payload } = qrData;

    // 1. Verify signature
    const isValid = verifySignature(payload, signature);
    if (!isValid) {
      return { valid: false, reason: "Invalid QR signature — possible tampering" };
    }

    // 2. Check expiry
    if (Date.now() > payload.expiresAt) {
      return {
        valid:     false,
        reason:    "QR code has expired",
        expiredAt: new Date(payload.expiresAt),
      };
    }

    return {
      valid:     true,
      sessionId: payload.sessionId,
      courseId:  payload.courseId,
      teacherId: payload.teacherId,
      issuedAt:  new Date(payload.issuedAt),
      expiresAt: new Date(payload.expiresAt),
      secondsRemaining: Math.floor((payload.expiresAt - Date.now()) / 1000),
    };
  } catch (error) {
    return { valid: false, reason: "Invalid QR code format" };
  }
};

// ─── Get remaining time (for countdown timer on frontend) ────────────────────
const getQRTimeRemaining = (expiresAt) => {
  const ms = new Date(expiresAt) - Date.now();
  if (ms <= 0) return { expired: true, seconds: 0, formatted: "00:00" };

  const totalSeconds = Math.floor(ms / 1000);
  const minutes      = Math.floor(totalSeconds / 60);
  const seconds      = totalSeconds % 60;

  return {
    expired:   false,
    seconds:   totalSeconds,
    minutes,
    formatted: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  };
};

module.exports = {
  generateQRData,
  decodeQRData,
  getQRTimeRemaining,
  generateSignature,
  verifySignature,
  DEFAULT_EXPIRY_MINUTES,
};