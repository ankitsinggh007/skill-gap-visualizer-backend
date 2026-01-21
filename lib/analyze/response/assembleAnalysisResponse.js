// lib/analyze/response/assembleAnalysisResponse.js

/**
 * Normalize finalScore to 0-100 scale
 * Handles both 0-1 (decimal percentage) and 0-100 scales
 */
function normalizeFinalScore(finalScore) {
  const raw =
    typeof finalScore === "number"
      ? finalScore
      : Number.isFinite(finalScore?.percentage)
        ? finalScore.percentage
        : 0;

  // If looks like 0..1 fraction, convert to 0..100
  const scaled = raw <= 1 ? raw * 100 : raw;

  // Clamp and round reasonably
  return Math.max(0, Math.min(100, Number(scaled.toFixed(2))));
}

export function assembleAnalysisResponse({
  finalScore,
  categoryScores,
  insights,
  strengthWeakness,
  recommendations,
  atsReadiness,
}) {
  return {
    finalScore: normalizeFinalScore(finalScore),
    categoryScores,
    insights,
    strengthWeakness,
    atsReadiness,
    recommendations,
  };
}
