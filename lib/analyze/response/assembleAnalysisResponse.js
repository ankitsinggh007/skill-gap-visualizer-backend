// lib/analyze/response/assembleAnalysisResponse.js

export function assembleAnalysisResponse({
  finalScore,
  categoryScores,
  insights,
  strengthWeakness,
  matches,
  recommendations,
  atsReadiness,
}) {
  return {
    score: finalScore,
    categoryScores,

    // Layer-D insights
    insights,
    strengths: strengthWeakness.strengths,
    weaknesses: strengthWeakness.weaknesses,
    criticalGaps: strengthWeakness.criticalGaps,

    // Extra info

    matches,
    recommendations,
    atsKeywordReadiness: {
      score: atsReadiness.score,
      total: atsReadiness.total,
      percentage: atsReadiness.percentage,
      matchedKeywords: atsReadiness.matchedKeywords,
      missingKeywords: atsReadiness.missingKeywords,
    }
  };
}
