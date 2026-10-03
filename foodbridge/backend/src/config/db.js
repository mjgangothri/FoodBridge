import pg from "pg";

const realPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/foodbridge",
});

const memoryStore = {
  users: [
    { id: 1, name: "Campus Canteen Manager", role: "donor", org: "Green Valley Dining Hall", created_at: new Date() },
    { id: 2, name: "Courier Alex", role: "volunteer", org: "Swift Food Rescue", created_at: new Date() },
    { id: 3, name: "Hope Shelter Staff", role: "ngo", org: "Hope Community Kitchen", created_at: new Date() }
  ],
  listings: [
    {
      id: 1,
      donor_id: 1,
      donor_name: "Campus Canteen Manager",
      donor_org: "Green Valley Dining Hall",
      title: "50 Servings Fresh Veg Biryani & Curry",
      meals: 50,
      pickup_address: "Student Center Gate 3, Central Campus",
      notes: "Packed in sanitized hot containers. Ready for immediate pickup.",
      expires_at: new Date(Date.now() + 120 * 60000).toISOString(),
      status: "available",
      volunteer_id: null,
      volunteer_name: null,
      ngo_id: null,
      ngo_org: null,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      donor_id: 1,
      donor_name: "Campus Canteen Manager",
      donor_org: "Green Valley Dining Hall",
      title: "30 Packets Fresh Sandwiches & Fruit",
      meals: 30,
      pickup_address: "Faculty Club Dining, West Wing",
      notes: "Vegetarian and vegan options included.",
      expires_at: new Date(Date.now() + 45 * 60000).toISOString(),
      status: "claimed",
      volunteer_id: 2,
      volunteer_name: "Courier Alex",
      ngo_id: null,
      ngo_org: null,
      created_at: new Date().toISOString()
    }
  ]
};

export const pool = {
  async query(text, params = []) {
    try {
      const res = await realPool.query(text, params);
      return res;
    } catch (_err) {
      // Fallback to memory store when PostgreSQL DB server is offline
      return handleMemoryQuery(text, params);
    }
  },
  on() {}
};

function handleMemoryQuery(text, params = []) {
  const sql = text.trim();
  
  if (sql.includes("SELECT * FROM users WHERE id = $1")) {
    const user = memoryStore.users.find(u => u.id === Number(params[0]));
    return { rows: user ? [user] : [] };
  }

  if (sql.includes("SELECT * FROM users WHERE LOWER(name) = LOWER($1)")) {
    const user = memoryStore.users.find(u => u.name.toLowerCase() === String(params[0]).toLowerCase());
    return { rows: user ? [user] : [] };
  }

  if (sql.includes("SELECT * FROM users ORDER BY id ASC") || sql.includes("SELECT * FROM users")) {
    return { rows: memoryStore.users };
  }

  if (sql.includes("INSERT INTO users")) {
    const id = memoryStore.users.length + 1;
    const user = { id, name: params[0], role: params[1], org: params[2] || null, created_at: new Date() };
    memoryStore.users.push(user);
    return { rows: [user] };
  }

  if (sql.includes("SELECT l.*") || sql.includes("FROM listings")) {
    if (sql.includes("WHERE l.id = $1") || sql.includes("WHERE id = $1")) {
      const item = memoryStore.listings.find(l => l.id === Number(params[0]));
      return { rows: item ? [item] : [] };
    }
    return { rows: memoryStore.listings };
  }

  if (sql.includes("INSERT INTO listings")) {
    const id = memoryStore.listings.length + 1;
    const item = {
      id,
      donor_id: params[0] || 1,
      donor_name: "Campus Canteen Manager",
      donor_org: "Green Valley Dining Hall",
      title: params[1],
      meals: Number(params[2]),
      pickup_address: params[3],
      notes: params[4] || null,
      expires_at: params[5],
      status: "available",
      volunteer_id: null,
      volunteer_name: null,
      ngo_id: null,
      ngo_org: null,
      created_at: new Date().toISOString()
    };
    memoryStore.listings.unshift(item);
    return { rows: [item] };
  }

  if (sql.includes("UPDATE listings")) {
    const idIndex = params.length - 1;
    const id = Number(params[idIndex]);
    const item = memoryStore.listings.find(l => l.id === id);
    if (item) {
      if (sql.includes("claimed")) {
        item.status = "claimed";
        item.volunteer_id = Number(params[0]);
        const vol = memoryStore.users.find(u => u.id === item.volunteer_id);
        if (vol) item.volunteer_name = vol.name;
      } else if (sql.includes("collected")) {
        item.status = "collected";
      } else if (sql.includes("distributed")) {
        item.status = "distributed";
        item.ngo_id = Number(params[0]);
        const ngo = memoryStore.users.find(u => u.id === item.ngo_id);
        if (ngo) item.ngo_org = ngo.org || ngo.name;
      }
      return { rows: [item] };
    }
  }

  if (sql.includes("meals_diverted") || sql.includes("SUM(meals)")) {
    const totalMeals = memoryStore.listings.reduce((acc, l) => acc + (l.meals || 0), 0);
    const activeListings = memoryStore.listings.filter(l => l.status === "available" || l.status === "claimed").length;
    return { rows: [{ meals_diverted: totalMeals, active_listings: activeListings, total_meals: totalMeals, meals: totalMeals }] };
  }

  return { rows: [] };
}
