/**
 * Client-side countdown module for FoodBridge.
 * Computes human-readable timer strings, color-coded urgency states,
 * and auto-hide flags without requiring API round-trips.
 */

/**
 * Calculate expiry metrics for a listing timestamp.
 * 
 * Thresholds:
 * - Green: >= 120 minutes (2h+ remaining)
 * - Yellow: 60 to 119 minutes (1h to 2h remaining)
 * - Red: 1 to 59 minutes (<1h remaining / Urgent pickup)
 * - Expired: <= 0 minutes (Triggers auto-hide on available listings)
 * 
 * @param {string|number|Date} expiresAt - ISO string or Date object
 * @param {number} [now=Date.now()] - Current timestamp in ms
 * @returns {{ mins: number, cls: string, label: string, isExpired: boolean }}
 */
export function expiry(expiresAt, now = Date.now()) {
  const targetTime = new Date(expiresAt).getTime();
  const diffMs = targetTime - now;
  const mins = Math.floor(diffMs / 60000);

  if (isNaN(mins) || mins <= 0) {
    return {
      mins: 0,
      cls: "expired",
      label: "Expired",
      isExpired: true,
    };
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  const timeString = hours > 0
    ? `${hours}h ${String(remainingMins).padStart(2, "0")}m`
    : `${remainingMins}m`;

  if (mins < 60) {
    return {
      mins,
      cls: "red",
      label: `🔴 Urgent pickup: ${timeString} left`,
      isExpired: false,
    };
  }

  if (mins < 120) {
    return {
      mins,
      cls: "yellow",
      label: `🟡 ${timeString} remaining`,
      isExpired: false,
    };
  }

  return {
    mins,
    cls: "green",
    label: `🟢 ${timeString} remaining`,
    isExpired: false,
  };
}
