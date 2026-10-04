/**
 * FoodBridge API Client & Resilient Fallback Service
 * 
 * Communicates with backend endpoints (/api/listings, /api/impact/monthly, etc.)
 * adding the required `x-user-id` header for authenticated role context.
 * 
 * Includes an in-memory/localStorage fallback so that the web portal operates
 * smoothly in development even before or during backend deployment.
 */

// Initial Seed Data for local fallback mode
const SEED_USERS = {
  donor: { id: 1, name: "Campus Canteen Manager", role: "donor", org: "Green Valley Dining Hall" },
  volunteer: { id: 2, name: "Courier Alex", role: "volunteer", org: "Swift Rescue Network" },
  ngo: { id: 3, name: "Hope Community Shelter", role: "ngo", org: "Hope Shelter Kitchen" },
};

const SEED_LISTINGS = [
  {
    id: 1,
    donor_id: "usr_101",
    donor_name: "Green Valley Dining Hall",
    donor_org: "Campus Canteen",
    title: "50 Servings Fresh Veg Curry & Rice",
    meals: 50,
    pickup_address: "Student Center Gate 3, Central Campus",
    notes: "Packed in sanitized hot containers. Ready for immediate pickup.",
    expires_at: new Date(Date.now() + 140 * 60000).toISOString(), // ~2h 20m (Green)
    status: "available",
    volunteer_id: null,
    volunteer_name: null,
    ngo_id: null,
    ngo_org: null,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 2,
    donor_id: "usr_101",
    donor_name: "Green Valley Dining Hall",
    donor_org: "Campus Canteen",
    title: "35 Packets Fresh Sandwiches & Fruit",
    meals: 35,
    pickup_address: "Faculty Club Dining, West Wing",
    notes: "Vegetarian and vegan options clearly labeled.",
    expires_at: new Date(Date.now() + 75 * 60000).toISOString(), // ~1h 15m (Yellow)
    status: "available",
    volunteer_id: null,
    volunteer_name: null,
    ngo_id: null,
    ngo_org: null,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 3,
    donor_id: "usr_101",
    donor_name: "Green Valley Dining Hall",
    donor_org: "Campus Canteen",
    title: "20 Servings Bakery Rolls & Muffins",
    meals: 20,
    pickup_address: "Bakery Hub, North Gate Entrance",
    notes: "Freshly baked this morning.",
    expires_at: new Date(Date.now() + 40 * 60000).toISOString(), // ~40m (Red / Urgent)
    status: "available",
    volunteer_id: null,
    volunteer_name: null,
    ngo_id: null,
    ngo_org: null,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 4,
    donor_id: "usr_101",
    donor_name: "Green Valley Dining Hall",
    donor_org: "Campus Canteen",
    title: "40 Portions Pasta & Salad Trays",
    meals: 40,
    pickup_address: "Main Kitchen Receiving Dock",
    notes: "Chilled storage. Pickup via van required.",
    expires_at: new Date(Date.now() + 90 * 60000).toISOString(),
    status: "claimed",
    volunteer_id: "usr_201",
    volunteer_name: "Courier Alex",
    ngo_id: null,
    ngo_org: null,
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    claimed_at: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 5,
    donor_id: "usr_101",
    donor_name: "Green Valley Dining Hall",
    donor_org: "Campus Canteen",
    title: "60 Servings Steamed Rice & Dal",
    meals: 60,
    pickup_address: "Hostel 4 Canteen Kitchen",
    notes: "Delivered to NGO center.",
    expires_at: new Date(Date.now() - 10 * 60000).toISOString(),
    status: "distributed",
    volunteer_id: "usr_201",
    volunteer_name: "Courier Alex",
    ngo_id: "usr_301",
    ngo_org: "Hope Community Shelter",
    created_at: new Date(Date.now() - 180 * 60000).toISOString(),
    distributed_at: new Date(Date.now() - 20 * 60000).toISOString(),
  }
];

function getStoredListings() {
  try {
    const raw = localStorage.getItem("fb_mock_listings");
    if (raw) return JSON.parse(raw);
  } catch (_e) {}
  localStorage.setItem("fb_mock_listings", JSON.stringify(SEED_LISTINGS));
  return SEED_LISTINGS;
}

function setStoredListings(listings) {
  try {
    localStorage.setItem("fb_mock_listings", JSON.stringify(listings));
  } catch (_e) {}
}

export function getCurrentUser(roleKey = "donor") {
  return SEED_USERS[roleKey] || SEED_USERS.donor;
}

/**
 * Execute HTTP API requests with fallback to local mock store on connection failure.
 */
export async function apiCall(path, { method = "GET", body, userId = "usr_101" } = {}) {
  try {
    const res = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const err = new Error(data.error || `Request failed with status ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    // If backend returns an explicit 409 Conflict or 400 Bad Request, re-throw!
    if (err.status) throw err;

    // Otherwise, perform simulated local mock handling
    return handleLocalMockApi(path, method, body, userId);
  }
}

function handleLocalMockApi(path, method, body, userId) {
  let listings = getStoredListings();

  // GET /api/listings
  if (path.startsWith("/api/listings") && method === "GET") {
    return listings;
  }

  // POST /api/listings
  if (path === "/api/listings" && method === "POST") {
    const newListing = {
      id: Date.now(),
      donor_id: userId,
      donor_name: "Green Valley Dining Hall",
      donor_org: "Campus Canteen",
      title: body.title,
      meals: Number(body.meals),
      pickup_address: body.pickupAddress,
      notes: body.notes || "",
      expires_at: new Date(Date.now() + Number(body.expiresInMinutes) * 60000).toISOString(),
      status: "available",
      volunteer_id: null,
      volunteer_name: null,
      ngo_id: null,
      ngo_org: null,
      created_at: new Date().toISOString(),
    };
    listings.unshift(newListing);
    setStoredListings(listings);
    return newListing;
  }

  // POST /api/listings/:id/claim
  if (path.match(/\/api\/listings\/\d+\/claim/) && method === "POST") {
    const id = Number(path.split("/")[3]);
    const item = listings.find((l) => l.id === id);
    if (!item) throw new Error("Listing not found");

    if (item.status !== "available") {
      const conflictErr = new Error("Conflict: This listing has already been claimed by another volunteer courier.");
      conflictErr.status = 409;
      throw conflictErr;
    }

    item.status = "claimed";
    item.volunteer_id = userId;
    item.volunteer_name = userId === "usr_201" ? "Courier Alex" : `Volunteer (${userId})`;
    item.claimed_at = new Date().toISOString();
    setStoredListings(listings);
    return item;
  }

  // POST /api/listings/:id/collect
  if (path.match(/\/api\/listings\/\d+\/collect/) && method === "POST") {
    const id = Number(path.split("/")[3]);
    const item = listings.find((l) => l.id === id);
    if (!item) throw new Error("Listing not found");
    item.status = "collected";
    item.collected_at = new Date().toISOString();
    setStoredListings(listings);
    return item;
  }

  // POST /api/listings/:id/distribute
  if (path.match(/\/api\/listings\/\d+\/distribute/) && method === "POST") {
    const id = Number(path.split("/")[3]);
    const item = listings.find((l) => l.id === id);
    if (!item) throw new Error("Listing not found");
    item.status = "distributed";
    item.ngo_id = userId;
    item.ngo_org = "Hope Community Shelter";
    item.distributed_at = new Date().toISOString();
    setStoredListings(listings);
    return item;
  }

  // GET /api/impact/monthly or summary
  if (path.includes("/api/impact")) {
    const collectedAndDistributed = listings.filter((l) => l.status === "collected" || l.status === "distributed");
    const totalMeals = collectedAndDistributed.reduce((sum, l) => sum + (l.meals || 0), 0);
    const activeCount = listings.filter((l) => l.status === "available" || l.status === "claimed").length;

    return {
      meals_diverted: totalMeals,
      active_listings: activeCount,
      meals: totalMeals,
      waste_kg: totalMeals * 0.40,
      co2e_kg: totalMeals * 0.40 * 2.50,
    };
  }

  return { ok: true };
}
