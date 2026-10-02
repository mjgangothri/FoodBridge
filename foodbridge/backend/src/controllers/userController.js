import { pool } from "../config/db.js";

const ROLES = ["donor", "volunteer", "ngo"];

// DEMO AUTH: the client sends x-user-id. Replace with real login (JWT/OAuth) before production.
export async function attachUser(req, _res, next) {
  const id = Number(req.get("x-user-id"));
  if (Number.isInteger(id) && id > 0) {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    req.user = rows[0] ?? null;
  }
  next();
}

export const requireRole = (role) => (req, res, next) =>
  req.user?.role === role ? next() : res.status(403).json({ error: `Only ${role}s can do this` });

export async function createUser(req, res) {
  const { name, role, org } = req.body ?? {};
  if (!String(name ?? "").trim() || !ROLES.includes(role)) {
    return res.status(400).json({ error: "name and a valid role (donor, volunteer, ngo) are required" });
  }
  const { rows } = await pool.query(
    "INSERT INTO users (name, role, org) VALUES ($1,$2,$3) RETURNING *",
    [name.trim().slice(0, 60), role, String(org ?? "").trim().slice(0, 80) || null]
  );
  res.status(201).json(rows[0]);
}
