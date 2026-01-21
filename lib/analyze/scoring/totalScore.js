import { round } from "../utils/round.js";

/**
 * Produces global readiness score from category scores.
 * Includes NaN protection and rounding.
 */

export function totalScore(categoryScores) {
  const categoryScore = categoryScores.reduce(
    (acc, c) => acc + (c.score || 0),
    0
  );

  const categoryPossible = categoryScores.reduce(
    (acc, c) => acc + (c.possible || 0),
    0
  );

  if (!categoryPossible) {
    return { score: 0, possible: 0, percentage: 0 };
  }

  const roundedScore = round(categoryScore);
  const roundedPossible = round(categoryPossible);

  return {
    score: roundedScore,
    possible: roundedPossible,
    percentage: round(roundedScore / roundedPossible),
  };
}
