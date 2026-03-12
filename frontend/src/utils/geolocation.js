// ─── utils/geolocation.js ─────────────────────────────────────────────────────
// Handles all GPS / location logic for the student attendance flow.

export const GpsStatus = {
  IDLE:        "idle",
  GETTING:     "getting",
  OK:          "ok",
  DENIED:      "denied",
  UNAVAILABLE: "unavailable",
  WEAK:        "weak",        // got coords but accuracy is poor (laptop/wifi)
};

// How many metres of accuracy is considered "good"
const GOOD_ACCURACY_M  = 100;
const WEAK_ACCURACY_M  = 300;

/**
 * Request the current GPS position once.
 * Returns { lat, lng, accuracy, status, error? }
 */
export async function getCurrentPosition(options = {}) {
  if (!navigator.geolocation) {
    return { lat: null, lng: null, accuracy: null, status: GpsStatus.UNAVAILABLE,
             error: "GPS is not supported on this device" };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const status = accuracy <= GOOD_ACCURACY_M
          ? GpsStatus.OK
          : accuracy <= WEAK_ACCURACY_M
            ? GpsStatus.WEAK
            : GpsStatus.WEAK;    // still send it; backend now skips geo-check for weak signal
        resolve({ lat, lng, accuracy, status });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ lat: null, lng: null, accuracy: null, status: GpsStatus.DENIED,
                    error: "Location permission denied — please allow it in browser settings" });
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          resolve({ lat: null, lng: null, accuracy: null, status: GpsStatus.UNAVAILABLE,
                    error: "Location unavailable — GPS signal not found" });
        } else {
          resolve({ lat: null, lng: null, accuracy: null, status: GpsStatus.UNAVAILABLE,
                    error: "Location request timed out — please try again" });
        }
      },
      {
        enableHighAccuracy: true,
        timeout:            options.timeout    ?? 12000,
        maximumAge:         options.maximumAge ?? 30000,
      }
    );
  });
}

/**
 * Watch GPS continuously (returns stopWatching fn).
 * onUpdate({ lat, lng, accuracy, status })
 */
export function watchPosition(onUpdate, onError) {
  if (!navigator.geolocation) {
    onError?.("GPS is not supported on this device");
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const status = accuracy <= GOOD_ACCURACY_M ? GpsStatus.OK : GpsStatus.WEAK;
      onUpdate({ lat, lng, accuracy, status });
    },
    (err) => {
      onError?.(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}

/**
 * Human-readable accuracy label
 */
export function accuracyLabel(accuracy) {
  if (accuracy === null || accuracy === undefined) return "Unknown";
  if (accuracy <= 10)  return "Excellent (±" + Math.round(accuracy) + "m)";
  if (accuracy <= 30)  return "Good (±"      + Math.round(accuracy) + "m)";
  if (accuracy <= 100) return "Fair (±"      + Math.round(accuracy) + "m)";
  if (accuracy <= 300) return "Weak (±"      + Math.round(accuracy) + "m)";
  return "Very Weak (±" + Math.round(accuracy) + "m)";
}

/**
 * Signal quality 0–1 float (for UI rings etc.)
 */
export function accuracyScore(accuracy) {
  if (!accuracy) return 0;
  if (accuracy <= 10)  return 1.0;
  if (accuracy <= 30)  return 0.85;
  if (accuracy <= 100) return 0.65;
  if (accuracy <= 300) return 0.35;
  return 0.1;
}