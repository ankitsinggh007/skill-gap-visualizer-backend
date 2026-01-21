// lib/analyze/scoring/getStrengthWeakness.js

export function getStrengthWeakness(categoryScores) {
  const strengths = [];
  const weaknesses = [];
  const criticalGaps = [];

  for (const cat of categoryScores) {
    for (const skill of cat.skills) {
      const item = {
        category: cat.category,
        skill: skill.skillName,
        type: skill.matchType,
      };

      if (skill.matchType === "explicit") {
        strengths.push(item);
      } else if (skill.matchType === "weak") {
        weaknesses.push(item);
      } else if (skill.matchType === "missing") {
        // High-weight → critical
        if (skill.possible >= 0.03) {
          criticalGaps.push(item);
        } else {
          weaknesses.push(item);
        }
      }
    }
  }

  return {
    strengths,
    weaknesses,
    criticalGaps,
  };
}