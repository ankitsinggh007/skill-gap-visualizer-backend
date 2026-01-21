// lib/analyze/scoring/getCategoryInsights.js

export function getCategoryInsights(categoryScores) {
  return categoryScores.map((cat) => {
    let level = "Poor";

    if (cat.percentage >= 0.8) level = "Excellent";
    else if (cat.percentage >= 0.6) level = "Strong";
    else if (cat.percentage >= 0.4) level = "Average";
    else if (cat.percentage >= 0.2) level = "Weak";

    return {
      category: cat.category,
      score: cat.score,
      possible: cat.possible,
      percentage: cat.percentage,
      level,
    };
  });
}