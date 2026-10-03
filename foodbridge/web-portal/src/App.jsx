import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { DonorForm } from "./components/DonorForm";
import { ListingCard } from "./components/ListingCard";
import { ImpactStats } from "./components/ImpactStats";
import { AuthModal } from "./components/AuthModal";
import { calculateExpiryMetrics } from "./hooks/useCountdown";
import { apiCall, getCurrentUser } from "./services/api";
import { Truck, Building2, AlertTriangle, Layers, Clock, Sparkles } from "lucide-react";

export function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("fb_auth_user");
      if (saved) return JSON.parse(saved);
    } catch (_e) {}
    return getCurrentUser("donor");
  });

  const [activeRole, setActiveRole] = useState(() => currentUser?.role || "donor");
  const [activeTab, setActiveTab] = useState("board"); // "board" | "my_pickups" | "distribution" | "donor_form"
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  const [listings, setListings] = useState([]);
  const [impactData, setImpactData] = useState(null);
  const [myOrgImpactData, setMyOrgImpactData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("info");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerToast = useCallback((msg, type = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // Sync role selection with current user
  const handleRoleChange = (role) => {
    setActiveRole(role);
    if (role === "donor") setActiveTab("donor_form");
    else if (role === "volunteer") setActiveTab("board");
    else if (role === "ngo") setActiveTab("distribution");
  };

  const handleAuthenticate = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("fb_auth_user", JSON.stringify(user));
    } catch (_e) {}
    handleRoleChange(user.role);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("fb_auth_user");
    } catch (_e) {}
    setCurrentUser(null);
    triggerToast("Signed out. Operating in guest view.", "info");
  };

  // Fetch listings and impact metrics from API
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    const userId = currentUser?.id || "usr_101";
    try {
      const [listData, impactSummary, myOrgSummary] = await Promise.all([
        apiCall("/api/listings", { userId }),
        apiCall("/api/impact/summary", { userId }),
        apiCall(`/api/impact/monthly?donorId=${userId}`, { userId }),
      ]);

      if (Array.isArray(listData)) {
        setListings(listData);
      }
      setImpactData(impactSummary);
      setMyOrgImpactData(myOrgSummary);
    } catch (err) {
      triggerToast(err.message || "Failed to fetch platform state", "error");
    } finally {
      setIsRefreshing(false);
    }
  }, [currentUser?.id, triggerToast]);

  // Real-time client logic: Background data re-fetch every 60 seconds
  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Donor post action
  const handlePostListing = async (formData) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      triggerToast("Please authenticate with email before posting.", "error");
      return;
    }
    await apiCall("/api/listings", {
      method: "POST",
      body: formData,
      userId: currentUser.id,
    });
    await fetchData();
  };

  // Role action (claim, collect, distribute) with 409 Conflict handling
  const handleListingAction = async (id, act) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      triggerToast("Please authenticate with email to claim or distribute food.", "error");
      return;
    }
    try {
      await apiCall(`/api/listings/${id}/${act}`, {
        method: "POST",
        userId: currentUser.id,
      });
      triggerToast(
        act === "claim"
          ? "Pickup claimed! Moved to My Active Pickups."
          : act === "collect"
          ? "Marked as collected from donor!"
          : "Distribute confirmed! Rescue complete.",
        "success"
      );
      await fetchData();
    } catch (err) {
      await fetchData();
      throw err;
    }
  };

  // Filter listings based on State Machine & Expiry Rules
  const availableListings = listings
    .filter((l) => {
      if (l.status !== "available") return false;
      const metrics = calculateExpiryMetrics(l.expires_at);
      return !metrics.isExpired;
    })
    .sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());

  const myClaimedListings = listings.filter((l) => l.status === "claimed");
  const collectedListings = listings.filter((l) => l.status === "collected");
  const distributedListings = listings.filter((l) => l.status === "distributed");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar with Email Auth & Role Switcher */}
      <Navbar
        activeRole={activeRole}
        setActiveRole={handleRoleChange}
        currentUser={currentUser}
        totalDivertedMeals={impactData?.meals_diverted ?? 0}
        onRefresh={fetchData}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Auth Dialog Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticate={handleAuthenticate}
        toast={triggerToast}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl border shadow-2xl text-xs font-bold flex items-center gap-2.5 backdrop-blur-md ${
              toastType === "error"
                ? "bg-rose-500/90 text-white border-rose-400"
                : toastType === "success"
                ? "bg-emerald-500/90 text-slate-950 border-emerald-300"
                : "bg-sky-500/90 text-white border-sky-400"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Guest Email Authentication Prompt Banner */}
        {!currentUser && (
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>Browsing as Guest. Sign in with your email address to post surplus food or accept rescue pickups.</span>
            </div>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition-all whitespace-nowrap"
            >
              Sign In with Email
            </button>
          </div>
        )}

        {/* Environmental & Carbon Impact Analytics Section */}
        <ImpactStats
          impactData={impactData}
          myOrgImpactData={myOrgImpactData}
          activeRole={activeRole}
        />

        {/* Dynamic Navigation Sub-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("board")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "board"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Urgent Rescue Board</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950/40 text-[10px] font-mono">
                {availableListings.length}
              </span>
            </button>

            {activeRole === "volunteer" && (
              <button
                onClick={() => setActiveTab("my_pickups")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "my_pickups"
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>My Active Pickups</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950/40 text-[10px] font-mono">
                  {myClaimedListings.length}
                </span>
              </button>
            )}

            {activeRole === "ngo" && (
              <button
                onClick={() => setActiveTab("distribution")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "distribution"
                    ? "bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>NGO Distribution Hub</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950/40 text-[10px] font-mono">
                  {collectedListings.length}
                </span>
              </button>
            )}

            {activeRole === "donor" && (
              <button
                onClick={() => setActiveTab("donor_form")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "donor_form"
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Post Surplus Listing</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>State Sync:</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Auto-tick 30s / Fetch 60s
            </span>
          </div>

        </div>

        {/* View 1: Donor Posting Form */}
        {activeRole === "donor" && activeTab === "donor_form" && (
          <div className="max-w-3xl mx-auto">
            <DonorForm
              onPostListing={handlePostListing}
              currentUser={currentUser}
              toast={triggerToast}
            />
          </div>
        )}

        {/* View 2: Urgent Rescue Board (Available listings sorted by soonest expiry) */}
        {activeTab === "board" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Urgent Rescue Listings</span>
                  <span className="text-xs font-normal text-slate-400">(Available for Volunteer Claim)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sorted by soonest expiry first. Expired items are automatically hidden.
                </p>
              </div>
            </div>

            {availableListings.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
                <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-300">No Available Rescue Listings Right Now</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  All posted surplus food has either been claimed by couriers or expired safely. Switch to Donor View to post a new listing!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableListings.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    activeRole={activeRole}
                    currentUser={currentUser}
                    onAction={handleListingAction}
                    toast={triggerToast}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* View 3: Volunteer Active Pickups */}
        {activeRole === "volunteer" && activeTab === "my_pickups" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">My Active Claimed Pickups</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Listings you accepted for rescue courier dispatch. Mark collected once picked up from donor.
              </p>
            </div>

            {myClaimedListings.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
                <Truck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-300">No Active Pickups Claimed</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Go to the Urgent Rescue Board tab to accept and claim available food pickups!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myClaimedListings.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    activeRole={activeRole}
                    currentUser={currentUser}
                    onAction={handleListingAction}
                    toast={triggerToast}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* View 4: NGO Distribution Hub */}
        {activeRole === "ngo" && activeTab === "distribution" && (
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">NGO Distribution Hub</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Surplus food collected by couriers awaiting final distribution to community beneficiaries.
              </p>
            </div>

            {collectedListings.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-300">No Items Awaiting NGO Distribution</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Items marked 'Collected' by rescue couriers will appear here automatically for NGO distribution confirmation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collectedListings.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    activeRole={activeRole}
                    currentUser={currentUser}
                    onAction={handleListingAction}
                    toast={triggerToast}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Section 5: Completed Rescues Board */}
        {distributedListings.length > 0 && (
          <section className="pt-8 border-t border-slate-900 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recently Distributed & Completed Rescues ({distributedListings.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {distributedListings.map((l) => (
                <div key={l.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                  <div className="font-bold text-slate-200 line-clamp-1">{l.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{l.meals} meals &bull; {l.ngo_org || "NGO Center"}</div>
                  <div className="mt-2 text-[10px] text-purple-400 font-semibold">✓ LIFECYCLE COMPLETED</div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong>FoodBridge Platform</strong> &bull; Client Expiry Sync &amp; Surplus Rescue Architecture
          </div>
          <div>
            UN SDG 2 (Zero Hunger) &amp; SDG 12 (Responsible Consumption)
          </div>
        </div>
      </footer>

    </div>
  );
}
