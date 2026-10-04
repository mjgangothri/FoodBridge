import { pool } from "../config/db.js";

const ROLES = ["donor", "volunteer", "ngo"];

// DEMO AUTH: the client sends x-user-id. Replace with real login (JWT/OAuth) before production.
export async function attachUser(req, _res, next) {
  const rawId = req.get("x-user-id");
  let id = Number(rawId);

  if (isNaN(id) && typeof rawId === "string") {
    if (rawId.includes("101") || rawId.includes("donor")) id = 1;
    else if (rawId.includes("201") || rawId.includes("volunteer")) id = 2;
    else if (rawId.includes("301") || rawId.includes("ngo")) id = 3;
    else {
      const match = rawId.match(/\d+/);
      if (match) id = Number(match[0]);
    }
  }

  if (Number.isInteger(id) && id > 0) {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    req.user = rows[0] ?? null;
  }

  if (!req.user && rawId) {
    if (String(rawId).includes("101") || String(rawId).includes("donor")) {
      req.user = { id: 1, name: "Campus Canteen Manager", role: "donor", org: "Green Valley Dining Hall" };
    } else if (String(rawId).includes("201") || String(rawId).includes("volunteer")) {
      req.user = { id: 2, name: "Courier Alex", role: "volunteer", org: "Swift Rescue Network" };
    } else if (String(rawId).includes("301") || String(rawId).includes("ngo")) {
      req.user = { id: 3, name: "Hope Shelter Staff", role: "ngo", org: "Hope Shelter Kitchen" };
    }
  }

  next();
}

export const requireRole = (role) => (req, res, next) =>
  req.user?.role === role ? next() : res.status(403).json({ error: `Only ${role}s can do this` });

export async function getUsers(_req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM users ORDER BY id ASC LIMIT 50");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

export async function loginUser(req, res) {
  const { name, role } = req.body ?? {};
  const trimmedName = String(name ?? "").trim();
  
  if (!trimmedName) {
    return res.status(400).json({ error: "Name or identity identifier is required" });
  }

  try {
    let query = "SELECT * FROM users WHERE LOWER(name) = LOWER($1)";
    let params = [trimmedName];

    if (role && ROLES.includes(role)) {
      query += " AND role = $2";
      params.push(role);
    }

    query += " ORDER BY id DESC LIMIT 1";
    const { rows } = await pool.query(query, params);

    if (rows.length > 0) {
      return res.json(rows[0]);
    }

    // If user not found, create a new user if role is provided
    if (role && ROLES.includes(role)) {
      const { rows: newRows } = await pool.query(
        "INSERT INTO users (name, role, org) VALUES ($1,$2,$3) RETURNING *",
        [trimmedName.slice(0, 60), role, req.body.org ? String(req.body.org).trim().slice(0, 80) : null]
      );
      return res.status(201).json(newRows[0]);
    }

    return res.status(444 || 404).json({ error: "Account not found. Please register or select your role to sign up." });
  } catch (err) {
    res.status(500).json({ error: "Login failed: " + err.message });
  }
}

export async function createUser(req, res) {
  const { name, role, org } = req.body ?? {};
  if (!String(name ?? "").trim() || !ROLES.includes(role)) {
    return res.status(400).json({ error: "Name and a valid role (donor, volunteer, ngo) are required" });
  }
  const { rows } = await pool.query(
    "INSERT INTO users (name, role, org) VALUES ($1,$2,$3) RETURNING *",
    [name.trim().slice(0, 60), role, String(org ?? "").trim().slice(0, 80) || null]
  );
  res.status(201).json(rows[0]);
}

