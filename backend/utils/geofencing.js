// const geolib = require("geolib");

// const DEFAULT_RADIUS      = 100;  // metres
// const MAX_ACCURACY_MARGIN = 50;   // max GPS accuracy bonus in metres
// const WEAK_SIGNAL_THRESHOLD = 300; // accuracy > 300m = unusable

// // ─── Location attempt logger ──────────────────────────────────────────────────
// const logLocationAttempt = ({
//   studentId, sessionId,
//   studentLat, studentLng, studentAccuracy,
//   classLat, classLng,
//   distance, isWithin, reason, skipped,
// }) => {
//   const timestamp = new Date().toISOString();
//   const status    = skipped ? "SKIPPED" : isWithin ? "ALLOWED" : "DENIED";
//   console.log(
//     `[GEOFENCE][${timestamp}] ${status} | ` +
//     `Student: ${studentId || "unknown"} | ` +
//     `Session: ${sessionId || "unknown"} | ` +
//     `Distance: ${distance !== null ? distance + "m" : "N/A"} | ` +
//     `Accuracy: ${studentAccuracy !== null ? "±" + studentAccuracy + "m" : "N/A"} | ` +
//     `Reason: ${reason}`
//   );
// };

// // ─── Validate coordinates ─────────────────────────────────────────────────────
// const validateCoordinates = (lat, lng) => {
//   const parsedLat = parseFloat(lat);
//   const parsedLng = parseFloat(lng);
//   if (isNaN(parsedLat) || isNaN(parsedLng)) {
//     return { valid: false, reason: "Coordinates must be valid numbers" };
//   }
//   if (parsedLat < -90 || parsedLat > 90) {
//     return { valid: false, reason: "Latitude must be between -90 and 90" };
//   }
//   if (parsedLng < -180 || parsedLng > 180) {
//     return { valid: false, reason: "Longitude must be between -180 and 180" };
//   }
//   return { valid: true, lat: parsedLat, lng: parsedLng };
// };

// // ─── Check GPS signal quality ─────────────────────────────────────────────────
// const assessSignalQuality = (accuracy) => {
//   if (accuracy === null || accuracy === undefined) {
//     return { quality: "unknown",  label: "Unknown",   usable: true  };
//   }
//   if (accuracy <= 10)  return { quality: "excellent", label: "Excellent", usable: true  };
//   if (accuracy <= 30)  return { quality: "good",      label: "Good",      usable: true  };
//   if (accuracy <= 100) return { quality: "fair",      label: "Fair",      usable: true  };
//   if (accuracy <= 300) return { quality: "weak",      label: "Weak",      usable: true  };
//   return                      { quality: "unusable",  label: "Unusable",  usable: false };
// };

// // ─── Get compass direction ────────────────────────────────────────────────────
// const getDirection = (fromLat, fromLng, toLat, toLng) => {
//   try {
//     const bearing    = geolib.getGreatCircleBearing(
//       { latitude: fromLat, longitude: fromLng },
//       { latitude: toLat,   longitude: toLng   }
//     );
//     const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
//     return directions[Math.round(bearing / 45) % 8];
//   } catch {
//     return null;
//   }
// };

// // ─── Core: isWithinGeofence ───────────────────────────────────────────────────
// const isWithinGeofence = ({
//   studentLat,
//   studentLng,
//   studentAccuracy = null,
//   classLat,
//   classLng,
//   radius     = DEFAULT_RADIUS,
//   studentId  = null,
//   sessionId  = null,
// }) => {

//   // Edge case 1: class location not configured → skip check, allow attendance
//   if (classLat === null || classLat === undefined ||
//       classLng === null || classLng === undefined) {
//     const result = {
//       isWithin: true, distance: null, radius: null, skipped: true, signal: null,
//       reason:  "Geofence not configured for this classroom — attendance allowed",
//       status:  "skipped",
//     };
//     logLocationAttempt({ studentId, sessionId, studentLat, studentLng,
//       studentAccuracy, classLat, classLng, ...result });
//     return result;
//   }

//   // Edge case 2: student location unavailable
//   if (studentLat === null || studentLat === undefined ||
//       studentLng === null || studentLng === undefined) {
//     const result = {
//       isWithin: false, distance: null, radius, skipped: false, signal: null,
//       reason:  "Your location is unavailable — please enable GPS and try again",
//       status:  "no_location",
//     };
//     logLocationAttempt({ studentId, sessionId, studentLat, studentLng,
//       studentAccuracy, classLat, classLng, ...result });
//     return result;
//   }

//   // Edge case 3: validate coordinate values
//   const coordCheck = validateCoordinates(studentLat, studentLng);
//   if (!coordCheck.valid) {
//     const result = {
//       isWithin: false, distance: null, radius, skipped: false, signal: null,
//       reason:  `Invalid student location: ${coordCheck.reason}`,
//       status:  "invalid_coords",
//     };
//     logLocationAttempt({ studentId, sessionId, studentLat, studentLng,
//       studentAccuracy, classLat, classLng, ...result });
//     return result;
//   }

//   const sLat = coordCheck.lat;
//   const sLng = coordCheck.lng;

//   // Edge case 4: assess GPS signal quality
//   const parsedAccuracy = studentAccuracy !== null ? parseFloat(studentAccuracy) : null;
//   const signal         = assessSignalQuality(parsedAccuracy);

//   if (!signal.usable) {
//     const result = {
//       isWithin: false, distance: null, radius, skipped: false, signal,
//       reason:  `GPS signal too weak (±${Math.round(parsedAccuracy)}m) — move to open area and retry`,
//       status:  "weak_signal",
//     };
//     logLocationAttempt({ studentId, sessionId, studentLat: sLat, studentLng: sLng,
//       studentAccuracy: parsedAccuracy, classLat, classLng, ...result });
//     return result;
//   }

//   // Calculate distance using Haversine formula
//   const rawDistance     = geolib.getDistance(
//     { latitude: sLat,    longitude: sLng    },
//     { latitude: classLat, longitude: classLng }
//   );
//   const distance        = Math.round(rawDistance);

//   // Add GPS accuracy margin (capped)
//   const accuracyMargin  = parsedAccuracy ? Math.min(parsedAccuracy, MAX_ACCURACY_MARGIN) : 0;
//   const effectiveRadius = Math.round(radius + accuracyMargin);
//   const isWithin        = distance <= effectiveRadius;

//   const directionToClass = !isWithin
//     ? getDirection(sLat, sLng, classLat, classLng)
//     : null;

//   const result = {
//     isWithin,
//     distance,
//     radius:           effectiveRadius,
//     configuredRadius: radius,
//     accuracyMargin:   Math.round(accuracyMargin),
//     skipped:          false,
//     signal,
//     directionToClass,
//     studentLocation:  { lat: sLat,     lng: sLng      },
//     classLocation:    { lat: classLat,  lng: classLng  },
//     reason: isWithin
//       ? `Within geofence ✓ — ${distance}m from class (limit: ${effectiveRadius}m)`
//       : `Outside geofence ✗ — ${distance}m from class (limit: ${effectiveRadius}m)` +
//         (directionToClass ? `, head ${directionToClass}` : ""),
//     status: isWithin ? "within" : "outside",
//   };

//   logLocationAttempt({
//     studentId, sessionId,
//     studentLat: sLat, studentLng: sLng,
//     studentAccuracy: parsedAccuracy,
//     classLat, classLng, ...result,
//   });

//   return result;
// };

// // ─── Convenience wrapper used in attendanceController ─────────────────────────
// const verifyStudentLocation = ({ studentLat, studentLng, studentAccuracy, session, studentId }) => {
//   return isWithinGeofence({
//     studentLat,
//     studentLng,
//     studentAccuracy,
//     classLat:  session?.location?.lat,
//     classLng:  session?.location?.lng,
//     radius:    session?.location?.radius || DEFAULT_RADIUS,
//     sessionId: session?._id?.toString(),
//     studentId: studentId?.toString(),
//   });
// };

// module.exports = {
//   isWithinGeofence,
//   verifyStudentLocation,
//   validateCoordinates,
//   assessSignalQuality,
//   getDirection,
//   DEFAULT_RADIUS,
//   WEAK_SIGNAL_THRESHOLD,
// };

const geolib = require("geolib");

const DEFAULT_RADIUS      = 100;  // metres
const MAX_ACCURACY_MARGIN = 50;   // max GPS accuracy bonus in metres
const WEAK_SIGNAL_THRESHOLD = 300; // accuracy > 300m = unusable

// ─── Location attempt logger ──────────────────────────────────────────────────
const logLocationAttempt = ({
  studentId, sessionId,
  studentLat, studentLng, studentAccuracy,
  classLat, classLng,
  distance, isWithin, reason, skipped,
}) => {
  const timestamp = new Date().toISOString();
  const status    = skipped ? "SKIPPED" : isWithin ? "ALLOWED" : "DENIED";
  console.log(
    `[GEOFENCE][${timestamp}] ${status} | ` +
    `Student: ${studentId || "unknown"} | ` +
    `Session: ${sessionId || "unknown"} | ` +
    `Distance: ${distance !== null ? distance + "m" : "N/A"} | ` +
    `Accuracy: ${studentAccuracy !== null ? "±" + studentAccuracy + "m" : "N/A"} | ` +
    `Reason: ${reason}`
  );
};

// ─── Validate coordinates ─────────────────────────────────────────────────────
const validateCoordinates = (lat, lng) => {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return { valid: false, reason: "Coordinates must be valid numbers" };
  }
  if (parsedLat < -90 || parsedLat > 90) {
    return { valid: false, reason: "Latitude must be between -90 and 90" };
  }
  if (parsedLng < -180 || parsedLng > 180) {
    return { valid: false, reason: "Longitude must be between -180 and 180" };
  }
  return { valid: true, lat: parsedLat, lng: parsedLng };
};

// ─── Check GPS signal quality ─────────────────────────────────────────────────
const assessSignalQuality = (accuracy) => {
  if (accuracy === null || accuracy === undefined) {
    return { quality: "unknown",  label: "Unknown",   usable: true  };
  }
  if (accuracy <= 10)  return { quality: "excellent", label: "Excellent", usable: true  };
  if (accuracy <= 30)  return { quality: "good",      label: "Good",      usable: true  };
  if (accuracy <= 100) return { quality: "fair",      label: "Fair",      usable: true  };
  if (accuracy <= 300) return { quality: "weak",      label: "Weak",      usable: true  };
  return                      { quality: "unusable",  label: "Unusable",  usable: false };
};

// ─── Get compass direction ────────────────────────────────────────────────────
const getDirection = (fromLat, fromLng, toLat, toLng) => {
  try {
    const bearing    = geolib.getGreatCircleBearing(
      { latitude: fromLat, longitude: fromLng },
      { latitude: toLat,   longitude: toLng   }
    );
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return directions[Math.round(bearing / 45) % 8];
  } catch {
    return null;
  }
};

// ─── Core: isWithinGeofence ───────────────────────────────────────────────────
const isWithinGeofence = ({
  studentLat,
  studentLng,
  studentAccuracy = null,
  classLat,
  classLng,
  radius     = DEFAULT_RADIUS,
  studentId  = null,
  sessionId  = null,
}) => {

  // Edge case 1: class location not configured → skip check, allow attendance
  if (classLat === null || classLat === undefined ||
      classLng === null || classLng === undefined) {
    const result = {
      isWithin: true, distance: null, radius: null, skipped: true, signal: null,
      reason:  "Geofence not configured for this classroom — attendance allowed",
      status:  "skipped",
    };
    logLocationAttempt({ studentId, sessionId, studentLat, studentLng,
      studentAccuracy, classLat, classLng, ...result });
    return result;
  }

  // Edge case 2: student location unavailable
  if (studentLat === null || studentLat === undefined ||
      studentLng === null || studentLng === undefined) {
    const result = {
      isWithin: false, distance: null, radius, skipped: false, signal: null,
      reason:  "Your location is unavailable — please enable GPS and try again",
      status:  "no_location",
    };
    logLocationAttempt({ studentId, sessionId, studentLat, studentLng,
      studentAccuracy, classLat, classLng, ...result });
    return result;
  }

  // Edge case 3: validate coordinate values
  const coordCheck = validateCoordinates(studentLat, studentLng);
  if (!coordCheck.valid) {
    const result = {
      isWithin: false, distance: null, radius, skipped: false, signal: null,
      reason:  `Invalid student location: ${coordCheck.reason}`,
      status:  "invalid_coords",
    };
    logLocationAttempt({ studentId, sessionId, studentLat, studentLng,
      studentAccuracy, classLat, classLng, ...result });
    return result;
  }

  const sLat = coordCheck.lat;
  const sLng = coordCheck.lng;

  // Edge case 4: assess GPS signal quality
  const parsedAccuracy = studentAccuracy !== null ? parseFloat(studentAccuracy) : null;
  const signal         = assessSignalQuality(parsedAccuracy);

  if (!signal.usable) {
    // Weak GPS (common on laptops/desktops via WiFi) — skip geofencing
    // rather than blocking attendance entirely. Flag it for teacher review.
    const result = {
      isWithin:      true,   // allow attendance
      skipped:       true,   // mark as skipped (not verified)
      distance:      null,
      radius,
      signal,
      reason:        `GPS accuracy too low (±${Math.round(parsedAccuracy)}m) — location check skipped`,
      status:        "weak_signal_skipped",
      flagged:       true,   // teacher can see this was unverified
    };
    logLocationAttempt({ studentId, sessionId, studentLat: sLat, studentLng: sLng,
      studentAccuracy: parsedAccuracy, classLat, classLng, ...result });
    return result;
  }

  // Calculate distance using Haversine formula
  const rawDistance     = geolib.getDistance(
    { latitude: sLat,    longitude: sLng    },
    { latitude: classLat, longitude: classLng }
  );
  const distance        = Math.round(rawDistance);

  // Add GPS accuracy margin (capped)
  const accuracyMargin  = parsedAccuracy ? Math.min(parsedAccuracy, MAX_ACCURACY_MARGIN) : 0;
  const effectiveRadius = Math.round(radius + accuracyMargin);
  const isWithin        = distance <= effectiveRadius;

  const directionToClass = !isWithin
    ? getDirection(sLat, sLng, classLat, classLng)
    : null;

  const result = {
    isWithin,
    distance,
    radius:           effectiveRadius,
    configuredRadius: radius,
    accuracyMargin:   Math.round(accuracyMargin),
    skipped:          false,
    signal,
    directionToClass,
    studentLocation:  { lat: sLat,     lng: sLng      },
    classLocation:    { lat: classLat,  lng: classLng  },
    reason: isWithin
      ? `Within geofence ✓ — ${distance}m from class (limit: ${effectiveRadius}m)`
      : `Outside geofence ✗ — ${distance}m from class (limit: ${effectiveRadius}m)` +
        (directionToClass ? `, head ${directionToClass}` : ""),
    status: isWithin ? "within" : "outside",
  };

  logLocationAttempt({
    studentId, sessionId,
    studentLat: sLat, studentLng: sLng,
    studentAccuracy: parsedAccuracy,
    classLat, classLng, ...result,
  });

  return result;
};

// ─── Convenience wrapper used in attendanceController ─────────────────────────
const verifyStudentLocation = ({ studentLat, studentLng, studentAccuracy, session, studentId }) => {
  return isWithinGeofence({
    studentLat,
    studentLng,
    studentAccuracy,
    classLat:  session?.location?.lat,
    classLng:  session?.location?.lng,
    radius:    session?.location?.radius || DEFAULT_RADIUS,
    sessionId: session?._id?.toString(),
    studentId: studentId?.toString(),
  });
};

module.exports = {
  isWithinGeofence,
  verifyStudentLocation,
  validateCoordinates,
  assessSignalQuality,
  getDirection,
  DEFAULT_RADIUS,
  WEAK_SIGNAL_THRESHOLD,
};