import React from "react";

/**
 * FoodBridge River Bridge SVG Logo
 * 
 * Concept:
 * - River Wave: Flowing water curve beneath the bridge.
 * - Arch Bridge: Clean geometric arch spanning from donor bank to recipient bank.
 * - Food Crossing Node: Stylized dish/leaf crossing over the bridge arch with transit particles.
 */
export function Logo({ className = "w-10 h-10", showText = true }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <svg
        className={`${className} shrink-0 transition-transform duration-300 hover:scale-105`}
        viewBox="0 0 54 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="FoodBridge River Bridge Logo"
      >
        <defs>
          <linearGradient id="fbBridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="fbRiverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="fbFoodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer Shield Container */}
        <rect
          x="2"
          y="2"
          width="50"
          height="50"
          rx="14"
          fill="#064e3b"
          fillOpacity="0.25"
          stroke="#10b981"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />

        {/* River Waves beneath */}
        <path
          d="M8 38 C 14 36, 20 40, 27 38 C 34 36, 40 40, 46 38"
          stroke="url(#fbRiverGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M11 42 C 17 40, 23 44, 27 42 C 31 40, 37 44, 43 42"
          stroke="url(#fbRiverGrad)"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />

        {/* Bridge Pillars */}
        <rect x="10" y="32" width="4" height="7" rx="1.5" fill="#047857" />
        <rect x="40" y="32" width="4" height="7" rx="1.5" fill="#047857" />

        {/* Main Arch Bridge */}
        <path
          d="M 8 33 Q 27 18 46 33"
          stroke="url(#fbBridgeGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 12 33 Q 27 22 42 33"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 2"
          fill="none"
          opacity="0.9"
        />

        {/* Food Platter with Leaf Crossing Over River Bridge */}
        <circle cx="27" cy="17" r="6.5" fill="url(#fbFoodGrad)" />
        <path d="M 23.5 17 C 23.5 13.8, 30.5 13.8, 30.5 17 Z" fill="#ffffff" opacity="0.9" />
        <path d="M 27 10.5 C 29 7.5, 33 8.5, 32 11.5 C 30 12, 28 11.5, 27 10.5 Z" fill="#10b981" />

        {/* Motion Transit Particles */}
        <circle cx="17" cy="23" r="1.5" fill="#fbbf24" opacity="0.8" />
        <circle cx="37" cy="23" r="1.5" fill="#10b981" opacity="0.8" />
      </svg>

      {showText && (
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-white leading-none">
              Food<span className="text-emerald-400">Bridge</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-mono">
              v2.4 Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
            Surplus Food Rescue & River Bridge Logistics
          </p>
        </div>
      )}
    </div>
  );
}
