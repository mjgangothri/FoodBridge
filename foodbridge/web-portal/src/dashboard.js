import { expiry } from "./countdown.js";

const COLUMNS = [
  ["available", "🌱 Available", "Ready for volunteer pickup"],
  ["claimed", "🚴 Claimed", "Volunteer in transit"],
  ["collected", "📦 Collected", "Picked up from donor"],
  ["distributed", "🏢 Distributed", "Delivered to community NGO"],
];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

/**
 * Determine which role-based action button to render for a given card and user.
 * 
 * - Volunteer View: Available -> "Claim / Accept pickup"
 * - Volunteer View: Claimed (by self) -> "Mark Collected"
 * - NGO View: Collected -> "Confirm Received / Distribute"
 * - Guest View: Prompt to Log In
 */
function getAction(l, user) {
  if (!user) {
    if (l.status === "available") {
      return `<button class="btn-action btn-claim" onclick="document.getElementById('header-login-btn').click()">Log In to Claim Pickup</button>`;
    }
    return "";
  }

  const userId = Number(user.id);
  const isVolunteer = user.role === "volunteer";
  const isNgo = user.role === "ngo";

  if (isVolunteer && l.status === "available") {
    return btn(l.id, "claim", "Accept & Claim Pickup");
  }

  if (isVolunteer && l.status === "claimed" && Number(l.volunteer_id) === userId) {
    return btn(l.id, "collect", "Mark Food Collected");
  }

  if (isNgo && l.status === "collected") {
    return btn(l.id, "distribute", "Confirm Received & Distributed");
  }

  return "";
}

const btn = (id, act, label) =>
  `<button class="btn-action btn-${act}" data-id="${id}" data-act="${act}">${esc(label)}</button>`;

/**
 * Render a single food listing card.
 */
function card(l, user) {
  const isLive = l.status === "available" || l.status === "claimed";
  const e = expiry(l.expires_at);

  const timerBadge = isLive
    ? `<div class="timer-badge ${e.cls}">${e.label}</div>`
    : `<div class="timer-badge ${l.status}" style="background: #f1f5f9; color: #475569;">STATUS: ${l.status.toUpperCase()}</div>`;

  return `<article class="card ${isLive ? e.cls : l.status}" data-id="${l.id}">
    <div class="card-header">
      <h4 class="card-title">${esc(l.title)}</h4>
      <span class="meals-badge">${l.meals} ${l.meals === 1 ? "meal" : "meals"}</span>
    </div>
    
    <div class="card-details">
      <p class="donor-info">
        <strong>${esc(l.donor_org || l.donor_name)}</strong>
      </p>
      <p class="address-info">📍 ${esc(l.pickup_address)}</p>
      ${l.notes ? `<p class="notes-info">📝 <em>${esc(l.notes)}</em></p>` : ""}
    </div>

    ${timerBadge}

    ${l.volunteer_name ? `<p class="who-info" style="font-size:0.82rem; color:#0369a1; margin-top:4px;">🚴 Courier: <strong>${esc(l.volunteer_name)}</strong></p>` : ""}
    ${l.ngo_org ? `<p class="who-info" style="font-size:0.82rem; color:#6b21a8; margin-top:4px;">🏢 NGO: <strong>${esc(l.ngo_org)}</strong></p>` : ""}

    <div class="card-actions">
      ${getAction(l, user)}
    </div>
  </article>`;
}

/**
 * Render the full 4-column kanban countdown board.
 * Auto-hides items in 'available' column when remaining time hits 0.
 */
export function renderBoard(el, listings, user) {
  if (!el) return;

  el.innerHTML = COLUMNS.map(([key, label]) => {
    const items = listings.filter((l) => {
      if (l.status !== key) return false;
      if (key === "available") {
        const e = expiry(l.expires_at);
        if (e.isExpired) return false;
      }
      return true;
    });

    return `<section class="col col-${key}">
      <div class="col-header">
        <h3>${label}</h3>
        <span class="col-count">${items.length}</span>
      </div>
      <div class="col-body">
        ${
          items.map((l) => card(l, user)).join("") ||
          `<div class="empty-state">No listings currently in this stage.</div>`
        }
      </div>
    </section>`;
  }).join("");
}

/**
 * Render impact summary stats in the UI header.
 */
export function renderImpact(el, monthly, user, totalSummary) {
  if (el) {
    const who = user?.role === "donor" && user.org ? esc(user.org) : "FoodBridge donors";
    if (monthly && monthly.meals > 0) {
      el.innerHTML = `🌱 <strong>${who}</strong> have diverted <strong>${monthly.meals} meals</strong> from waste this month.`;
    } else {
      el.textContent = "🌱 Connecting donors and volunteers to eliminate food waste across local communities.";
    }
  }

  // Update hero stats grid numbers
  const totalMeals = totalSummary?.meals_diverted ?? 0;
  const activeCount = totalSummary?.active_listings ?? 0;

  const statMealsEl = document.getElementById("stat-meals-diverted");
  const statActiveEl = document.getElementById("stat-active-rescues");
  const statCo2El = document.getElementById("stat-co2-saved");

  if (statMealsEl) statMealsEl.textContent = `${totalMeals.toLocaleString()} Meals`;
  if (statActiveEl) statActiveEl.textContent = `${activeCount} Active`;
  // Approx 0.42kg CO2 saved per meal diverted from landfill
  if (statCo2El) statCo2El.textContent = `${(totalMeals * 0.42).toFixed(1)} kg`;
}
