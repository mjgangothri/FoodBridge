import { pool } from "../config/db.js";

// Same formula as game-client/src/utils/impactCalculator.js.
// Recomputed here so clients cannot inflate the impact number.
const POINTS_PER_MEAL = 25;
const WASTE_PENALTY = 0.5;

function computeMeals(saved, wasted) {
  const net = Math.max(0, saved - wasted * WASTE_PENALTY);
  return Math.round((net * 10 * 100) / POINTS_PER_MEAL) / 100;
}

export async function submitScore(req, res) {
  const { playerName, points, itemsSaved, itemsWasted } = req.body ?? {};

  const name = String(playerName ?? "").trim().slice(0, 30);
  const ints = [points, itemsSaved, itemsWasted];
  if (!name || !ints.every((n) => Number.isInteger(n) && n >= 0 && n < 100000)) {
    return res.status(400).json({ error: "playerName and non-negative integer stats are required" });
  }

  const meals = computeMeals(itemsSaved, itemsWasted);

  try {
    const player = await pool.query(
      `INSERT INTO players (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [name]
    );
    const { rows } = await pool.query(
      `INSERT INTO scores (player_id, points, items_saved, items_wasted, estimated_meals)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, estimated_meals`,
      [player.rows[0].id, points, itemsSaved, itemsWasted, meals]
    );
    res.status(201).json({ id: rows[0].id, estimatedMeals: Number(rows[0].estimated_meals) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save score" });
  }
}

export async function getLeaderboard(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT p.name, MAX(s.points) AS best_points,
              SUM(s.estimated_meals)::float AS total_meals,
              COUNT(*)::int AS games
       FROM scores s JOIN players p ON p.id = s.player_id
       GROUP BY p.name
       ORDER BY best_points DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load leaderboard" });
  }
}

export async function getImpactTotal(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(estimated_meals), 0)::float AS meals, COUNT(*)::int AS games FROM scores`
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load impact" });
  }
}
