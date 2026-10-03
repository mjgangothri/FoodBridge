import React, { useState } from "react";
import { Utensils, Scale, Leaf, Globe, Building } from "lucide-react";

export function ImpactStats({ impactData, myOrgImpactData, activeRole }) {
  const [filterMode, setFilterMode] = useState("platform"); // "platform" | "org"

  const activeStats = filterMode === "org" && myOrgImpactData ? myOrgImpactData : impactData;

  const totalMeals = activeStats?.meals_diverted ?? activeStats?.meals ?? 0;
  const wasteKg = activeStats?.waste_kg ?? totalMeals * 0.40;
  const co2eKg = activeStats?.co2e_kg ?? wasteKg * 2.50;

  return (
    <section className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            Environmental Impact & Resource Diversion Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quantified SDG 2 & SDG 12 metrics computed from verified surplus food rescue workflows.
          </p>
        </div>

        {/* Live Filter Toggle: Platform-wide vs My Organization */}
        <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setFilterMode("platform")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filterMode === "platform"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Platform-wide</span>
          </button>
          <button
            onClick={() => setFilterMode("org")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filterMode === "org"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>My Organization</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Total Diverted Meals */}
        <div className="glass-card rounded-xl p-4 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Meals Rescued</span>
            <Utensils className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalMeals.toLocaleString()} <span className="text-sm font-semibold text-emerald-400">meals</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Sum of <code className="text-emerald-300">collected</code> and <code className="text-emerald-300">distributed</code> food packages
          </p>
        </div>

        {/* Card 2: Estimated Waste Diverted (kg) */}
        <div className="glass-card rounded-xl p-4 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Food Waste Diverted</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {wasteKg.toFixed(1)} <span className="text-sm font-semibold text-amber-400">kg</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Computed at standard <code className="text-amber-300">1 meal = 0.40 kg</code> waste weight
          </p>
        </div>

        {/* Card 3: Carbon Mitigation (CO2e) */}
        <div className="glass-card rounded-xl p-4 border border-slate-800/80 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Carbon Offset (CO₂e)</span>
            <Leaf className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {co2eKg.toFixed(1)} <span className="text-sm font-semibold text-sky-400">kg CO₂e</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Prevented emissions at <code className="text-sky-300">1 kg waste = 2.50 kg CO₂e</code>
          </p>
        </div>

      </div>
    </section>
  );
}
