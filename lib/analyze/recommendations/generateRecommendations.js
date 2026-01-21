// lib/analyze/scoring/generateRecommendations.js

export function generateRecommendations(strengthWeakness, insights) {
  const recs = [];

  // 1. Category-level fixes
  for (const insight of insights) {
    if (insight.percentage < 0.4) {
      recs.push(
        `Improve your foundation in **${insight.category}**. Your skill coverage is currently at ${(insight.percentage * 100).toFixed(
          1
        )}%.`
      );
    }
  }

  // 2. Critical gaps
  for (const gap of strengthWeakness.criticalGaps) {
    recs.push(
      `Critical skill missing: **${gap.skill}** in **${gap.category}**. This is a core requirement.`
    );
  }

  // 3. Weak → strong conversions
  for (const w of strengthWeakness.weaknesses) {
    if (w.type === "weak") {
      recs.push(
        `Strengthen your weak understanding of **${w.skill}** (${w.category}).`
      );
    }
  }

  if (recs.length === 0) {
    recs.push("Excellent overall coverage. Keep refining and practicing.");
  }

  return recs;
}