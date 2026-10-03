import { createApi } from "./api.js";
import { renderBoard, renderImpact } from "./dashboard.js";
import { initAuth } from "./auth.js";

const $ = (id) => document.getElementById(id);

let listings = [];
let user = null;

const api = createApi(() => user);

function toast(msg, type = "info") {
  const t = $("toast");
  if (!t) return;
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  setTimeout(() => {
    if (t.textContent === msg) t.textContent = "";
  }, 4000);
}

// Initialize Authentication Module
const authManager = initAuth({
  api,
  onUserChange: (newUser) => {
    user = newUser;
    const postEl = $("post");
    if (postEl) {
      postEl.hidden = user?.role !== "donor";
    }
    refresh();
  },
  toast,
});

async function refresh() {
  try {
    const [list, monthly, sum] = await Promise.all([
      api("/api/listings"),
      api(`/api/impact/monthly${user?.role === "donor" ? `?donorId=${user.id}` : ""}`),
      api("/api/impact/summary"),
    ]);

    listings = Array.isArray(list) ? list : [];
    renderBoard($("board"), listings, user);
    renderImpact($("impact"), monthly, user, sum);
  } catch (e) {
    // If listings fail to fetch, render empty state gracefully
    listings = [];
    renderBoard($("board"), [], user);
  }
}

// Donor: Post surplus food form submission
$("postForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const f = Object.fromEntries(new FormData(form));

  const meals = Number(f.meals);
  const expiresInMinutes = Number(f.expiresInMinutes);

  if (!f.title?.trim() || !f.pickupAddress?.trim()) {
    return toast("Please fill in all required listing fields.", "error");
  }
  if (!Number.isInteger(meals) || meals < 1) {
    return toast("Meals must be a whole number >= 1.", "error");
  }
  if (!Number.isFinite(expiresInMinutes) || expiresInMinutes < 15 || expiresInMinutes > 1440) {
    return toast("Expiry duration must be between 15 and 1440 minutes (24 hours).", "error");
  }

  try {
    await api("/api/listings", { method: "POST", body: f });
    form.reset();
    toast("Surplus food listing published successfully!", "success");
    await refresh();
  } catch (err) {
    toast(err.message || "Failed to post listing", "error");
  }
});

// Board Actions Delegation (Claim, Collect, Distribute)
$("board")?.addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-act]");
  if (!b) return;

  const id = b.dataset.id;
  const act = b.dataset.act;

  if (!user) {
    authManager.openAuthModal("login");
    return;
  }

  b.disabled = true;
  b.textContent = "Processing...";

  try {
    await api(`/api/listings/${id}/${act}`, { method: "POST" });
    const actLabels = {
      claim: "Pickup claimed by courier!",
      collect: "Marked as collected from donor!",
      distribute: "Distribute confirmed at NGO center!",
    };
    toast(actLabels[act] || "Status updated!", "success");
    await refresh();
  } catch (err) {
    toast(err.message, "error");
    await refresh();
  }
});

// Preset button handlers for expiresInMinutes
document.addEventListener("click", (e) => {
  if (e.target.matches(".preset-btn")) {
    const val = e.target.dataset.val;
    const numInput = $("expiresInMinutesInput");
    if (numInput) numInput.value = val;
  }
});

// Timers:
// 1) Recompute local countdowns every 30s
setInterval(() => {
  renderBoard($("board"), listings, user);
}, 30_000);

// 2) Refresh backend state every 60s
setInterval(() => {
  refresh();
}, 60_000);

// Initial Boot
refresh();
