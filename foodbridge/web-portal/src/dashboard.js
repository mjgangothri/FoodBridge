import { expiry } from "./countdown.js";

const COLUMNS = [
  ["available", "Available"],
  ["claimed", "Claimed"],
  ["collected", "Collected"],
  ["distributed", "Distributed"],
];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Which button (if any) this user may press on this card.
function action(l, user) {
  if (!user) return "";
  if (user.role === "volunteer" && l.status === "available") return btn(l.id, "claim", "Accept pickup");
  if (user.role === "volunteer" && l.status === "claimed" && l.volunteer_id === user.id) return btn(l.id, "collect", "Mark collected");
  if (user.role === "ngo" && l.status === "collected") return btn(l.id, "distribute", "Confirm food received");
  return "";
}
const btn = (id, act, label) => `<button data-id="${id}" data-act="${act}">${label}</button>`;

function card(l, user) {
  const live = l.status === "available" || l.status === "claimed";
  const e = expiry(l.expires_at);
  return `<article class="card ${live ? e.cls : ""}">
    <h4>${esc(l.title)}</h4>
    <p class="meals">${l.meals} meals</p>
    <p>${esc(l.donor_org || l.donor_name)}<br>${esc(l.pickup_address)}</p>
    ${live ? `<p class="timer">${e.label}</p>` : ""}
    ${l.volunteer_name ? `<p class="who">Volunteer: ${esc(l.volunteer_name)}</p>` : ""}
    ${l.ngo_org ? `<p class="who">Received by ${esc(l.ngo_org)}</p>` : ""}
    ${action(l, user)}
  </article>`;
}

export function renderBoard(el, listings, user) {
  el.innerHTML = COLUMNS.map(([key, label]) => {
    const items = listings.filter((l) => l.status === key);
    return `<section class="col"><h3>${label} <span>${items.length}</span></h3>
      ${items.map((l) => card(l, user)).join("") || `<p class="empty">Nothing here yet.</p>`}</section>`;
  }).join("");
}

export function renderImpact(el, monthly, user) {
  const who = user?.role === "donor" && user.org ? `your ${esc(user.org)}` : "FoodBridge donors";
  el.textContent = monthly.meals > 0
    ? `This month, ${who.replace(/&amp;/g, "&")} diverted ${monthly.meals} meals from waste.`
    : "No meals diverted yet this month. The first listing starts the count.";
}
