import { createApi } from "./api.js";
import { renderBoard, renderImpact } from "./dashboard.js";

const $ = (id) => document.getElementById(id);
const ROLE_HELP = {
  donor: "Post surplus food. Volunteers nearby are notified by the board.",
  volunteer: "Accept a pickup, collect the food, and bring it to people who need it.",
  ngo: "Confirm when collected food reaches your community.",
};

let user = JSON.parse(localStorage.getItem("fb_user") || "null");
let listings = [];
const api = createApi(() => user);

function toast(msg) { const t = $("toast"); t.textContent = msg; setTimeout(() => (t.textContent = ""), 4000); }

function renderSession() {
  $("join").hidden = !!user;
  $("session").hidden = !user;
  $("post").hidden = user?.role !== "donor";
  if (user) {
    $("who").textContent = `${user.name} (${user.role}${user.org ? `, ${user.org}` : ""})`;
    $("role-help").textContent = ROLE_HELP[user.role];
  }
}

async function refresh() {
  try {
    const [list, monthly, sum] = await Promise.all([
      api("/api/listings"),
      api(`/api/impact/monthly${user?.role === "donor" ? `?donorId=${user.id}` : ""}`),
      api("/api/impact/summary"),
    ]);
    listings = list;
    renderBoard($("board"), listings, user);
    renderImpact($("impact"), monthly, user);
    $("total").textContent = `${sum.meals_diverted} meals diverted in total`;
  } catch (e) { toast(e.message); }
}

$("join").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  try {
    user = await api("/api/users", { method: "POST", body: Object.fromEntries(f) });
    localStorage.setItem("fb_user", JSON.stringify(user));
    renderSession(); refresh();
  } catch (err) { toast(err.message); }
});

$("logout").addEventListener("click", () => { localStorage.removeItem("fb_user"); user = null; renderSession(); refresh(); });

$("post").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  try {
    await api("/api/listings", { method: "POST", body: f });
    e.target.reset(); toast("Listing posted."); refresh();
  } catch (err) { toast(err.message); }
});

$("board").addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-act]");
  if (!b) return;
  try {
    await api(`/api/listings/${b.dataset.id}/${b.dataset.act}`, { method: "POST" });
    refresh();
  } catch (err) { toast(err.message); refresh(); }
});

renderSession();
refresh();
setInterval(() => renderBoard($("board"), listings, user), 30_000); // tick countdowns
setInterval(refresh, 60_000);                                       // pull new data
