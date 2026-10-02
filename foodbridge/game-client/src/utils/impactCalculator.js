// Converts a finished run into real-world meaning.
// Keep in sync with computeMeals() in backend/src/controllers/scoreController.js
export const POINTS_PER_ITEM = 10;
export const POINTS_PER_MEAL = 25;
export const WASTE_PENALTY = 0.5;

export function calculateImpact(itemsSaved, itemsWasted) {
  const net = Math.max(0, itemsSaved - itemsWasted * WASTE_PENALTY);
  const points = Math.round(net * POINTS_PER_ITEM);
  const meals = Math.round((points * 100) / POINTS_PER_MEAL) / 100;
  return { points, meals };
}
