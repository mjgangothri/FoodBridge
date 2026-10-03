import React, { useState } from "react";
import { ShieldAlert, Award, User, RefreshCw, Mail, LogOut, ChevronDown, KeyRound } from "lucide-react";
import { Logo } from "./Logo";

export function Navbar({ activeRole, setActiveRole, currentUser, totalDivertedMeals, onRefresh, onOpenAuth, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roles = [
    { key: "donor", label: "Donor View" },
    { key: "volunteer", label: "Volunteer Courier" },
    { key: "ngo", label: "NGO Distribution Hub" },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: River Bridge SVG Logo & SDG Badges */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <Logo className="w-11 h-11" showText={true} />

          {/* SDG Indicator Badges */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <span title="SDG 2: Zero Hunger" className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Award className="w-3 h-3" /> SDG 2
            </span>
            <span title="SDG 12: Responsible Consumption & Production" className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> SDG 12
            </span>
          </div>
        </div>

        {/* Center: Live Platform Impact Ticker */}
        <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-400">Impact Ticker:</span>
          <strong className="text-emerald-400 font-bold">{totalDivertedMeals} verified meals diverted</strong>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-400">0.40kg/meal waste offset</span>
        </div>

        {/* Right: Fast Role Switcher Pill & Email Authentication Menu */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={onRefresh}
            title="Manual sync"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Fast Role Selector Pill */}
          <div className="inline-flex p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold shadow-inner">
            {roles.map((r) => {
              const isActive = activeRole === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setActiveRole(r.key)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Email Auth Trigger & User Account Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.email ? currentUser.email[0].toUpperCase() : "U"}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-slate-200 font-bold text-[11px] leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-emerald-400 text-[10px] font-mono leading-tight truncate max-w-[120px]">
                    {currentUser.email || currentUser.id}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Account Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl border border-slate-800 shadow-2xl p-3 z-50 animate-fadeIn">
                  <div className="pb-2.5 mb-2 border-b border-slate-800">
                    <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-emerald-400 font-mono truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {currentUser.email || `${currentUser.id}@foodbridge.org`}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                      Role: <span className="text-amber-400">{currentUser.role}</span> &bull; {currentUser.org}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors mb-1"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Switch Email Account</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-xs font-semibold text-rose-400 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Sign In</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
