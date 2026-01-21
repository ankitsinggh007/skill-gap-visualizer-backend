// lib/analyze/index.js

import { preprocessResume } from "./preprocess.js";
import { normalizeSkills } from "./normalizeSkills.js";
import { matchAllSkills } from "./matchEngine.js";

import { scoreCategories } from "./scoring/scoreCategories.js";
import { totalScore } from "./scoring/totalScore.js";
import { getCategoryInsights } from "./insights/getCategoryInsights.js";
import { getStrengthWeakness } from "./insights/getStrengthWeakness.js";
import { generateRecommendations } from "./recommendations/generateRecommendations.js";
import { assembleAnalysisResponse } from "./response/assembleAnalysisResponse.js";
import { computeATSKeywordReadiness } from "./ats/computeATSKeywordReadiness.js";
import { loadBenchmark } from "../benchmark/loader.js";

/**
 * Master Orchestrator (Layer A → B → C → D)
 */
export async function analyzeResume({
  resumeText,
  extractedSkills = [],
  inferredSkills = [],
  experienceYears = 0,

  role = "react",
  level = "junior",
  companyType = "unicorn",
}) {
  try {
    // ------------------------------------------
    // 0. Basic validation
    // ------------------------------------------
    if (!resumeText || !resumeText.trim()) {
      return {
        error: "Resume text is required.",
        metadata: { role, level, companyType, experienceYears },
      };
    }

    // ------------------------------------------
    // 1. Load benchmark
    // ------------------------------------------
    const benchmark = loadBenchmark(role, level, companyType);
    if (!benchmark) {
      return {
        error: "Benchmark not found",
        details: { role, level, companyType },
      };
    }

    // ------------------------------------------
    // 2. Layer A → Preprocess resume text
    // ------------------------------------------
    const normalizedResume = preprocessResume(resumeText);

    // ------------------------------------------
    // 3. Layer B → Normalize skills
    // ------------------------------------------
    const normalizedSkills = normalizeSkills(extractedSkills, inferredSkills);

    // ------------------------------------------
    // 4. Layer C → Match skills
    // ------------------------------------------
    const matches = matchAllSkills(
      benchmark.categories,
      normalizedResume,
      normalizedSkills.allSkills,
    );

    // ------------------------------------------
    // 5. Layer D → Scoring engine
    // ------------------------------------------
    const categoryScores = scoreCategories(matches, benchmark);
    const finalScore = totalScore(categoryScores);
    const insights = getCategoryInsights(categoryScores);
    const strengthWeakness = getStrengthWeakness(categoryScores);

    // ------------------------------------------
    // 6. ATS Keyword Readiness
    // ------------------------------------------
    const atsReadiness = computeATSKeywordReadiness({
      normalizedResume,
      benchmark,
    });
    const recommendations = generateRecommendations(strengthWeakness, insights);

    // ------------------------------------------
    // 7. Final assembly
    // ------------------------------------------
    const analysis = assembleAnalysisResponse({
      finalScore,
      categoryScores,
      insights,
      strengthWeakness,
      recommendations,
      atsReadiness,
    });

    return {
      metadata: { role, level, companyType, experienceYears },
      matches,
      analysis,
    };
  } catch (err) {
    return {
      error: "Internal analyzeResume failure",
      message: err.message,
    };
  }
}
