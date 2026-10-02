import { pool } from "../config/db.js";

export function requireApiKey(req, res, next) {
  if (!process.env.AUDIT_API_KEY || req.get("x-api-key") !== process.env.AUDIT_API_KEY) {
    return res.status(401).json({ error: "Missing or invalid x-api-key" });
  }
  next();
}

function validRow(r) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(r.audit_date) &&
    r.location && r.volunteer && r.food_type &&
    Number(r.weight_kg) >= 0 &&
    Number.isInteger(Number(r.meals_served)) && Number(r.meals_served) >= 0
  );
}

export async function bulkInsertAudits(req, res) {
  const rows = req.body?.rows;
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
    return res.status(400).json({ error: "Send 1-500 rows in { rows: [...] }" });
  }

  const bad = rows.map((r, i) => (validRow(r) ? null : i + 2)).filter(Boolean); // +2 = CSV line number
  if (bad.length) {
    return res.status(422).json({ error: "Invalid rows", csvLines: bad });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let inserted = 0;
    for (const r of rows) {
      const result = await client.query(
        `INSERT INTO audits (audit_date, location, volunteer, food_type, weight_kg, meals_served, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (audit_date, location, volunteer, food_type) DO NOTHING`,
        [r.audit_date, r.location, r.volunteer, r.food_type, r.weight_kg, r.meals_served, r.notes || null]
      );
      inserted += result.rowCount;
    }
    await client.query("COMMIT");
    res.status(201).json({ received: rows.length, inserted, skippedDuplicates: rows.length - inserted });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Could not save audits" });
  } finally {
    client.release();
  }
}

export async function getAuditSummary(_req, res) {
  try {
    const totals = await pool.query(
      `SELECT COALESCE(SUM(meals_served),0)::int AS verified_meals,
              COALESCE(SUM(weight_kg),0)::float AS total_kg,
              COUNT(*)::int AS audits
       FROM audits`
    );
    const recent = await pool.query(
      `SELECT audit_date, location, food_type, weight_kg::float, meals_served
       FROM audits ORDER BY audit_date DESC, id DESC LIMIT 8`
    );
    res.json({ ...totals.rows[0], recent: recent.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load audit summary" });
  }
}
