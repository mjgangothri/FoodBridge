import { pool } from "../config/db.js";

// green >= 2h, yellow 1-2h, red < 1h (urgent), expired <= 0
export function urgencyOf(expiresAt, now = Date.now()) {
  const minutesLeft = Math.floor((new Date(expiresAt) - now) / 60000);
  const urgency = minutesLeft <= 0 ? "expired" : minutesLeft < 60 ? "red" : minutesLeft < 120 ? "yellow" : "green";
  return { minutesLeft, urgency };
}

const SELECT = `
  SELECT l.*, d.org AS donor_org, d.name AS donor_name,
         v.name AS volunteer_name, n.org AS ngo_org
  FROM listings l
  JOIN users d ON d.id = l.donor_id
  LEFT JOIN users v ON v.id = l.volunteer_id
  LEFT JOIN users n ON n.id = l.ngo_id`;

export async function listListings(_req, res) {
  try {
    // Hide food nobody claimed in time; claimed/collected items stay visible.
    const { rows } = await pool.query(
      `${SELECT}
       WHERE l.status <> 'available' OR l.expires_at > now()
       ORDER BY l.expires_at ASC LIMIT 200`
    );
    res.json(rows.map((r) => ({ ...r, ...urgencyOf(r.expires_at) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load listings" });
  }
}

export async function createListing(req, res) {
  const { title, meals, pickupAddress, notes, expiresInMinutes } = req.body ?? {};
  const mins = Number(expiresInMinutes);
  if (!String(title ?? "").trim() || !String(pickupAddress ?? "").trim() ||
      !Number.isInteger(Number(meals)) || Number(meals) < 1 || !(mins >= 15 && mins <= 1440)) {
    return res.status(400).json({ error: "title, pickupAddress, meals (>=1) and expiresInMinutes (15-1440) are required" });
  }
  const { rows } = await pool.query(
    `INSERT INTO listings (donor_id, title, meals, pickup_address, notes, expires_at)
     VALUES ($1,$2,$3,$4,$5, now() + ($6 || ' minutes')::interval) RETURNING id`,
    [req.user.id, title.trim().slice(0, 80), Number(meals), pickupAddress.trim().slice(0, 160), notes || null, String(mins)]
  );
  res.status(201).json(rows[0]);
}

export async function updateListing(req, res) {
  const id = Number(req.params.id);
  const { title, meals, pickupAddress, notes, expiresInMinutes } = req.body ?? {};
  const mins = Number(expiresInMinutes);

  if (!Number.isInteger(id) || id < 1 ||
      !String(title ?? "").trim() ||
      !String(pickupAddress ?? "").trim() ||
      !Number.isInteger(Number(meals)) || Number(meals) < 1 ||
      !Number.isInteger(mins) || mins < 15 || mins > 1440) {
    return res.status(400).json({
      error: "A valid id, title, pickupAddress, meals (>=1) and expiresInMinutes (15-1440) are required",
    });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE listings
       SET title=$3, meals=$4, pickup_address=$5, notes=$6,
           expires_at=now() + ($7::int * interval '1 minute')
       WHERE id=$1 AND donor_id=$2 AND status='available'
       RETURNING id, title, meals, pickup_address, notes, expires_at, status`,
      [
        id,
        req.user.id,
        title.trim().slice(0, 80),
        Number(meals),
        pickupAddress.trim().slice(0, 160),
        notes ? String(notes) : null,
        mins,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Listing not found, not owned by you, or no longer available" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update listing" });
  }
}

export async function cancelListing(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "A valid listing id is required" });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE listings
       SET status='cancelled'
       WHERE id=$1 AND donor_id=$2 AND status='available'
       RETURNING id, status`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Listing not found, not owned by you, or no longer available" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not cancel listing" });
  }
}

// Each transition is one guarded UPDATE, so two volunteers cannot claim the same listing.
function transition(sql, conflictMsg) {
  return async (req, res) => {
    try {
      const r = await pool.query(sql, [Number(req.params.id), req.user.id]);
      if (r.rowCount === 0) return res.status(409).json({ error: conflictMsg });
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not update listing" });
    }
  };
}

export const claimListing = transition(
  `UPDATE listings SET status='claimed', volunteer_id=$2, claimed_at=now()
   WHERE id=$1 AND status='available' AND expires_at > now()`,
  "Already claimed or expired"
);

export const collectListing = transition(
  `UPDATE listings SET status='collected', collected_at=now()
   WHERE id=$1 AND status='claimed' AND volunteer_id=$2`,
  "Only the claiming volunteer can mark this collected"
);

export const distributeListing = transition(
  `UPDATE listings SET status='distributed', ngo_id=$2, distributed_at=now()
   WHERE id=$1 AND status='collected'`,
  "Food must be collected before it can be received"
);

// "This month, your campus diverted 420 meals from waste."
export async function monthlyImpact(req, res) {
  const donorId = Number(req.query.donorId);
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(l.meals),0)::int AS meals, COUNT(*)::int AS listings, MAX(d.org) AS org
       FROM listings l JOIN users d ON d.id = l.donor_id
       WHERE l.status IN ('collected','distributed')
         AND l.collected_at >= date_trunc('month', now())
         AND ($1::int IS NULL OR l.donor_id = $1)`,
      [Number.isInteger(donorId) ? donorId : null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load impact" });
  }
}

export async function pipelineSummary(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status='available' AND expires_at > now())::int AS available,
         COUNT(*) FILTER (WHERE status='claimed')::int AS claimed,
         COUNT(*) FILTER (WHERE status='collected')::int AS collected,
         COUNT(*) FILTER (WHERE status='distributed')::int AS distributed,
         COALESCE(SUM(meals) FILTER (WHERE status IN ('collected','distributed')),0)::int AS meals_diverted
       FROM listings`
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load summary" });
  }
}
