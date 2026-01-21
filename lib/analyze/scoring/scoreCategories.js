import { round } from "../utils/round.js";

/**
 * Computes weighted scores for each category.
 * FIXES:
 * - Normalized explicit/weak sets
 * - Case-insensitive matching
 * - Rounding on ALL numeric outputs
 */

export function scoreCategories(matches, benchmark) {
  const { matchedSkills, weakSignals, missingSkills } = matches;

  // --- Normalized matching sets ---
  const explicitSet = new Set(matchedSkills.map((s) => s.skill.toLowerCase()));
  const weakSet = new Set(weakSignals.map((s) => s.skill.toLowerCase()));
  const missingSet = new Set(missingSkills.map((s) => s.skill.toLowerCase()));

  const categoryScores = benchmark.categories.map((category) => {
    const catFactor = category.weight;

    let score = 0;
    let possible = 0;

    const skills = category.skills.map((skill) => {
      const key = skill.name.toLowerCase();
      const skillPossible = catFactor * skill.weight;
      possible += skillPossible;

      let matchType = "missing";
      let skillScore = 0;

      if (explicitSet.has(key)) {
        matchType = "explicit";
        skillScore = skillPossible;
      } else if (weakSet.has(key)) {
        matchType = "weak";
        skillScore = skillPossible * 0.5;
      } else if (missingSet.has(key)) {
        matchType = "missing";
      }

      score += skillScore;

      return {
        skillName: skill.name,
        matchType,
        score: round(skillScore), // ← FIX #1
        possible: round(skillPossible), // ← FIX #2
      };
    });

    const roundedScore = round(score);
    const roundedPossible = round(possible);

    return {
      category: category.name,
      score: roundedScore,
      possible: roundedPossible,
      percentage:
        roundedPossible === 0 ? 0 : round(roundedScore / roundedPossible), // ← FIX #3
      skills,
    };
  });

  return categoryScores;
}
