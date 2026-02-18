import { round } from "../utils/round.js";

/**
 * Produces global readiness score from category scores.
 * Includes NaN protection, ratio clamping (0..1), and rounding.
 */

export function totalScore(categoryScores) {
  const categoryScore = categoryScores.reduce(
    (acc, c) => acc + (c.score || 0),
    0,
  );

  const categoryPossible = categoryScores.reduce(
    (acc, c) => acc + (c.possible || 0),
    0,
  );

  if (!categoryPossible) {
    return { score: 0, possible: 0, percentage: 0 };
  }

  const roundedScore = round(categoryScore);
  const roundedPossible = round(categoryPossible);

  // Calculate percentage and clamp to [0, 1] to prevent score collapse
  let rawPercentage = roundedScore / roundedPossible;
  rawPercentage = Math.max(0, Math.min(1, rawPercentage));
  const clampedPercentage = round(rawPercentage);

  return {
    score: roundedScore,
    possible: roundedPossible,
    percentage: clampedPercentage,
  };
}
