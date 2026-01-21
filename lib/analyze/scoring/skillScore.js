// lib/analyze/scoring/skillScore.js

/**
 * Returns numerical score contribution of a skill.
 * Explicit = full weight, Weak = 50%, Missing = 0.
 */

export function skillScore(weight, matchType) {
  switch (matchType) {
    case "explicit":
      return weight;
    case "weak":
      return weight * 0.5;
    default:
      return 0;
  }
}