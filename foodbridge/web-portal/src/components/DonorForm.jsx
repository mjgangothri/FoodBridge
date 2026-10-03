import React, { useState } from "react";
import { PlusCircle, Clock, MapPin, Utensils, Sparkles, CheckCircle2 } from "lucide-react";

export function DonorForm({ onPostListing, currentUser, toast }) {
  const [title, setTitle] = useState("");
  const [meals, setMeals] = useState(30);
  const [expiresInMinutes, setExpiresInMinutes] = useState(120); // Default 2 hours
  const [pickupAddress, setPickupAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expiryPresets = [
    { label: "30 Mins", val: 30 },
    { label: "1 Hour", val: 60 },
    { label: "2 Hours", val: 120 },
    { label: "4 Hours", val: 240 },
    { label: "8 Hours", val: 480 },
    { label: "24 Hours", val: 1440 },
  ];

  const fillSample = () => {
    setTitle("75 Portions Fresh Veg Biryani & Curry");
    setMeals(75);
    setExpiresInMinutes(60);
    setPickupAddress("Campus Student Center, Gate 2 Loading Bay");
    setNotes("100% Pure Vegetarian. Packed in sanitized thermal boxes. Hot and ready for dispatch.");
    toast("Auto-filled sample listing details!", "info");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast("Please enter a surplus food description.", "error");
      return;
    }
    if (!pickupAddress.trim()) {
      toast("Please specify a pickup location address.", "error");
      return;
    }
    const mealCount = Number(meals);
    if (!Number.isInteger(mealCount) || mealCount < 1) {
      toast("Meals must be a whole number of at least 1.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await onPostListing({
        title: title.trim(),
        meals: mealCount,
        expiresInMinutes: Number(expiresInMinutes),
        pickupAddress: pickupAddress.trim(),
        notes: notes.trim(),
      });

      // Clear form on success
      setTitle("");
      setMeals(30);
      setPickupAddress("");
      setNotes("");
      toast("Surplus food listing published to rescue network!", "success");
    } catch (err) {
      toast(err.message || "Failed to post listing.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
      
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Post Surplus Food Listing
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Donor Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Broadcast excess edible meals to nearby rescue couriers before shelf-life expires.
          </p>
        </div>

        <button
          type="button"
          onClick={fillSample}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-emerald-400 border border-slate-700/80 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Auto-Fill Sample</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Food Description */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-400" />
              Surplus Food Description / Item Title *
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 50 Servings Fresh Veg Curry & Basmati Rice"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>

          {/* Meals Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Estimated Number of Edible Meals (min: 1) *
            </label>
            <input
              type="number"
              required
              min={1}
              max={5000}
              value={meals}
              onChange={(e) => setMeals(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>

          {/* Shelf Life / Expiry Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Expiry Window / Safe Shelf Life *
            </label>
            <select
              value={expiresInMinutes}
              onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            >
              <option value={30}>30 Minutes (Urgent Rescue)</option>
              <option value={60}>1 Hour</option>
              <option value={120}>2 Hours (Standard)</option>
              <option value={240}>4 Hours</option>
              <option value={480}>8 Hours</option>
              <option value={1440}>24 Hours (Max)</option>
            </select>
          </div>

          {/* Expiry Quick Preset Buttons */}
          <div className="md:col-span-2 flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Quick Presets:</span>
            {expiryPresets.map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => setExpiresInMinutes(p.val)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  expiresInMinutes === p.val
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                    : "bg-slate-950/80 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Pickup Address */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Pickup Location Address & Gate Instructions *
            </label>
            <input
              type="text"
              required
              maxLength={160}
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="e.g. Student Center Gate 3, Central Campus Receiving Dock"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>

          {/* Handling & Dietary Notes */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300">
              Dietary & Storage Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 100% Pure Vegetarian. Packed in sanitized insulated containers. Thermal gloves recommended."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>

        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
        >
          {isSubmitting ? (
            <span>Publishing Listing...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>Publish Surplus Food Listing</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
