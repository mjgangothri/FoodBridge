import React, { useState } from "react";
import { Mail, Lock, User, Building, ShieldCheck, X, Sparkles, KeyRound } from "lucide-react";

export function AuthModal({ isOpen, onClose, onAuthenticate, toast }) {
  const [tab, setTab] = useState("login"); // "login" | "register" | "quick"
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState("donor");

  // Register State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState("donor");
  const [regOrg, setRegOrg] = useState("");
  const [regPassword, setRegPassword] = useState("");

  if (!isOpen) return null;

  const demoAccounts = [
    {
      name: "Campus Canteen Manager",
      email: "canteen@foodbridge.org",
      role: "donor",
      org: "Green Valley Dining Hall",
      id: 1,
    },
    {
      name: "Courier Alex",
      email: "courier.alex@foodbridge.org",
      role: "volunteer",
      org: "Swift Rescue Network",
      id: 2,
    },
    {
      name: "Hope Shelter Staff",
      email: "shelter.hope@foodbridge.org",
      role: "ngo",
      org: "Hope Community Shelter",
      id: 3,
    },
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginEmail.includes("@")) {
      toast("Please enter a valid email address.", "error");
      return;
    }

    const name = loginEmail.split("@")[0].replace(/[._]/g, " ");
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

    const authenticatedUser = {
      id: loginRole === "donor" ? 1 : loginRole === "volunteer" ? 2 : 3,
      email: loginEmail.trim().toLowerCase(),
      name: formattedName,
      role: loginRole,
      org: loginRole === "donor" ? "Campus Food Donor" : loginRole === "volunteer" ? "Rescue Courier" : "Community NGO",
    };

    onAuthenticate(authenticatedUser);
    toast(`Authenticated as ${authenticatedUser.email} (${authenticatedUser.role.toUpperCase()})`, "success");
    onClose();
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!regName.trim()) {
      toast("Please enter your full name.", "error");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      toast("Please enter a valid email address.", "error");
      return;
    }

    const newUser = {
      id: `usr_${Date.now().toString().slice(-4)}`,
      email: regEmail.trim().toLowerCase(),
      name: regName.trim(),
      role: regRole,
      org: regOrg.trim() || `${regName}'s Organization`,
    };

    onAuthenticate(newUser);
    toast(`Account created! Welcome, ${newUser.name} (${newUser.role.toUpperCase()})`, "success");
    onClose();
  };

  const handleQuickSelect = (acc) => {
    onAuthenticate(acc);
    toast(`Signed in with demo email: ${acc.email}`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mail className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-white">Email Authentication</h2>
          </div>
          <p className="text-xs text-slate-400">
            Sign in with your email address to access food donor, courier, and NGO rescue portals.
          </p>
        </div>

        {/* Auth Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              tab === "login"
                ? "text-emerald-400 border-emerald-400 bg-slate-900"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            🔑 Email Sign In
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              tab === "register"
                ? "text-emerald-400 border-emerald-400 bg-slate-900"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            📝 Register
          </button>
          <button
            onClick={() => setTab("quick")}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              tab === "quick"
                ? "text-emerald-400 border-emerald-400 bg-slate-900"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            ⚡ Demo Accounts
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* Tab 1: Email Login */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. manager@dininghall.org"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Password / PIN (Optional for Demo)
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Operational Role *</label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                >
                  <option value="donor">Food Donor (Restaurant / Canteen / Event)</option>
                  <option value="volunteer">Volunteer Courier (Rescue Courier)</option>
                  <option value="ngo">NGO Distribution Hub (Shelter / Center)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authenticate &amp; Access Portal</span>
              </button>
            </form>
          )}

          {/* Tab 2: Register Account */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Full Name / Representative Name *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. sarah@dininghall.org"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Operational Role *</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all"
                >
                  <option value="donor">Food Donor (Dining Hall, Hotel, Bakery)</option>
                  <option value="volunteer">Volunteer Courier (Rescue Logistics)</option>
                  <option value="ngo">Community NGO / Shelter Center</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-sky-400" />
                  Organization / Facility Name
                </label>
                <input
                  type="text"
                  value={regOrg}
                  onChange={(e) => setRegOrg(e.target.value)}
                  placeholder="e.g. Green Valley Dining Hall"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Create Account &amp; Start Session</span>
              </button>
            </form>
          )}

          {/* Tab 3: Quick Demo Email Accounts */}
          {tab === "quick" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Click any pre-configured email account for instant 1-click authentication test access:
              </p>
              {demoAccounts.map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleQuickSelect(acc)}
                  className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{acc.email}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {acc.name} &bull; {acc.org}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    acc.role === "donor" ? "bg-emerald-500/20 text-emerald-300" :
                    acc.role === "volunteer" ? "bg-amber-500/20 text-amber-300" :
                    "bg-sky-500/20 text-sky-300"
                  }`}>
                    {acc.role}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
