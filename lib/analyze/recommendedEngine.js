/**
 * Generate resume-focused recommendations based on benchmark gaps.
 *
 * @param {Array} missingSkills  // [{ skill, category }]
 * @param {Array} weakSignals    // [{ skill, category, type }]
 * @param {Object} benchmark
 * @param {number} experienceYears
 */
export function buildRecommendations(
  missingSkills,
  weakSignals,
  benchmark,
  experienceYears = 0
) {
  const nextSteps = [];

  // 1️⃣ Category lookup map for weighted advice
  const weightMap = {};
  benchmark.categories.forEach((cat) => {
    weightMap[cat.name] = cat.weight;
  });

  // 2️⃣ Missing skills → strongest recommendations
  for (const item of missingSkills) {
    const catWeight = weightMap[item.category] ?? 0;

    const severity =
      catWeight >= 0.3
        ? "HIGH PRIORITY"
        : catWeight >= 0.2
          ? "Medium priority"
          : "Low priority";

    nextSteps.push(
      `${severity}: Add clearer evidence of **${item.skill}**. This is part of the expected ${item.category} skill set for this role.`
    );
  }

  // 3️⃣ Weak signals → resume clarity improvements
  for (const item of weakSignals) {
    const prefix =
      item.type === "fallback-token"
        ? "Mentioned indirectly through keywords"
        : "Implied by resume context";

    nextSteps.push(
      `${item.skill} — ${prefix}. Consider adding one explicit bullet point to strengthen clarity.`
    );
  }
  // 4️⃣ Experience suggestions (if benchmark defines a range)
  if (benchmark.expectedExperienceRange) {
    const { min } = benchmark.expectedExperienceRange;

    if (experienceYears < min) {
      nextSteps.push(
        `Your resume indicates ~${experienceYears} years of experience. Unicorn expectations for ${benchmark.level} typically start at ~${min} years. Ensure your achievements highlight depth, not duration.`
      );
    }
  }

  // 5️⃣ If nothing missing or weak → positive validation
  if (nextSteps.length === 0) {
    nextSteps.push(
      "Your resume strongly aligns with unicorn expectations for this role."
    );
  }

  return nextSteps;
}
