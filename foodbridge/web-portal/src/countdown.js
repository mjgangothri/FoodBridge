// Client-side countdown so cards update without refetching.
export function expiry(expiresAt, now = Date.now()) {
  const mins = Math.floor((new Date(expiresAt) - now) / 60000);
  if (mins <= 0) return { cls: "expired", label: "Expired" };
  const h = Math.floor(mins / 60), m = mins % 60;
  const t = h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
  if (mins < 60) return { cls: "red", label: `🔴 Urgent pickup: ${t} left` };
  if (mins < 120) return { cls: "yellow", label: `🟡 ${t} remaining` };
  return { cls: "green", label: `🟢 ${t} remaining` };
}
