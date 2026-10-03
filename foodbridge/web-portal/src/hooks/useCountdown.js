import { useState, useEffect } from "react";

/**
 * Custom React Hook: useCountdown
 * Calculates real-time expiration metrics, urgency states, and formatted time labels.
 * Ticks every 30 seconds to keep countdowns accurate without excessive re-renders.
 * 
 * Urgency Thresholds:
 * - Over 120 minutes (2h+): GREEN ("2h 10m remaining")
 * - 60 to 120 minutes (1h to 2h): YELLOW ("1h 05m remaining")
 * - 1 to 59 minutes (<1h): RED ("Urgent pickup: 45m left")
 * - <= 0 minutes: EXPIRED (Trigger auto-hide)
 */
export function calculateExpiryMetrics(expiresAt, now = Date.now()) {
  if (!expiresAt) {
    return {
      mins: 0,
      timeString: "Unknown",
      urgency: "expired",
      badgeClasses: "bg-slate-800 text-slate-400 border-slate-700",
      label: "Expired",
      isExpired: true,
    };
  }

  const targetTime = new Date(expiresAt).getTime();
  const diffMs = targetTime - now;
  const mins = Math.floor(diffMs / 60000);

  if (isNaN(mins) || mins <= 0) {
    return {
      mins: 0,
      timeString: "0m",
      urgency: "expired",
      badgeClasses: "bg-slate-800/80 text-slate-400 border-slate-700/60",
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
      timeString,
      urgency: "red",
      badgeClasses: "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse",
      label: `🔴 Urgent pickup: ${timeString} left`,
      isExpired: false,
    };
  }

  if (mins < 120) {
    return {
      mins,
      timeString,
      urgency: "yellow",
      badgeClasses: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      label: `🟡 ${timeString} remaining`,
      isExpired: false,
    };
  }

  return {
    mins,
    timeString,
    urgency: "green",
    badgeClasses: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    label: `🟢 ${timeString} remaining`,
    isExpired: false,
  };
}

export function useCountdown(expiresAt) {
  const [metrics, setMetrics] = useState(() => calculateExpiryMetrics(expiresAt));

  useEffect(() => {
    // Initial evaluation
    setMetrics(calculateExpiryMetrics(expiresAt));

    // Client-side ticker: update remaining time every 30 seconds
    const interval = setInterval(() => {
      setMetrics(calculateExpiryMetrics(expiresAt));
    }, 30000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return metrics;
}
