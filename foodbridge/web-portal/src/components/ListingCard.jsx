import React, { useState } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { MapPin, Clock, Truck, Building2, Utensils, AlertTriangle, CheckCircle } from "lucide-react";

export function ListingCard({ listing, activeRole, currentUser, onAction, toast }) {
  const [loading, setLoading] = useState(false);
  const countdown = useCountdown(listing.expires_at);

  const isLive = listing.status === "available" || listing.status === "claimed";
  const userId = currentUser?.id;

  const handleAction = async (act) => {
    setLoading(true);
    try {
      await onAction(listing.id, act);
    } catch (err) {
      if (err.status === 409 || err.message?.includes("409") || err.message?.includes("Conflict")) {
        toast("⚠️ Conflict: This pickup was just claimed by another volunteer courier!", "error");
      } else {
        toast(err.message || "Action failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine role-based action button
  const renderActionButton = () => {
    if (activeRole === "volunteer" && listing.status === "available") {
      return (
        <button
          disabled={loading}
          onClick={() => handleAction("claim")}
          className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>{loading ? "Claiming..." : "Accept Pickup / Claim"}</span>
        </button>
      );
    }

    if (
      activeRole === "volunteer" &&
      listing.status === "claimed" &&
      (String(listing.volunteer_id) === String(userId) || !listing.volunteer_id)
    ) {
      return (
        <button
          disabled={loading}
          onClick={() => handleAction("collect")}
          className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{loading ? "Processing..." : "Mark Food Collected"}</span>
        </button>
      );
    }

    if (activeRole === "ngo" && listing.status === "collected") {
      return (
        <button
          disabled={loading}
          onClick={() => handleAction("distribute")}
          className="w-full py-2 px-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{loading ? "Confirming..." : "Confirm Food Distributed"}</span>
        </button>
      );
    }

    return null;
  };

  return (
    <article className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-lg">
      
      {/* Top Header: Title & Meals Count Badge */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
            {listing.title}
          </h3>
          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-800 text-emerald-300 border border-slate-700 whitespace-nowrap">
            {listing.meals} {listing.meals === 1 ? "meal" : "meals"}
          </span>
        </div>

        {/* Donor info & Pickup Address */}
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <Utensils className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{listing.donor_org || listing.donor_name}</span>
          </div>

          <div className="flex items-start gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{listing.pickup_address}</span>
          </div>

          {listing.notes && (
            <div className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
              "{listing.notes}"
            </div>
          )}
        </div>
      </div>

      {/* Middle: Urgency Expiration Badge or Status */}
      <div>
        {isLive ? (
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between ${countdown.badgeClasses}`}>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {countdown.label}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-mono opacity-80">
              {countdown.urgency.toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            STATUS: {listing.status}
          </div>
        )}

        {/* Courier / NGO info if assigned */}
        {listing.volunteer_name && (
          <div className="mt-2 text-[11px] text-sky-400 flex items-center gap-1">
            <Truck className="w-3 h-3" /> Courier: <strong className="text-slate-200">{listing.volunteer_name}</strong>
          </div>
        )}
        {listing.ngo_org && (
          <div className="mt-1 text-[11px] text-purple-400 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> NGO: <strong className="text-slate-200">{listing.ngo_org}</strong>
          </div>
        )}
      </div>

      {/* Bottom: Action Button */}
      {renderActionButton()}
    </article>
  );
}
