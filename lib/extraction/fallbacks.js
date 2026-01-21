import { EMPTY_EXTRACTION_SCHEMA } from "./extractionSchema.js";

/**
 * Apply all fallback layers in correct order
 */
export function applyFallbacks(result, rawText) {
  let final = { ...result };

  // -------------------------
  // FALLBACK 1: Raw summary fix
  // -------------------------
  if (!final.rawSummary || final.rawSummary.trim().length < 5) {
    final.rawSummary = buildMinimalSummary(rawText);
  }

  // -------------------------
  // FALLBACK 2: Empty skill fix
  // -------------------------
  if (final.extractedSkills.length === 0 && final.inferredSkills.length === 0) {
    const auto = autoInferFromKeywords(rawText);
    final.extractedSkills = auto.extractedSkills;
    final.inferredSkills = auto.inferredSkills;
  }

  // -------------------------
  // FALLBACK 3: Education fallback
  // -------------------------
  if (!final.educationLevel || final.educationLevel === "") {
    final.educationLevel = detectEducation(rawText);
  }

  return final;
}

/**
 * Minimal summary generation when AI fails completely
 */
function buildMinimalSummary(rawText) {
  if (!rawText) return "";

  if (rawText.toLowerCase().includes("developer")) {
    return "Candidate with developer-related experience.";
  }
  if (rawText.toLowerCase().includes("engineer")) {
    return "Candidate with engineering background.";
  }
  return "Candidate resume text received.";
}

/**
 * Basic keyword-based pseudo extraction (fallback-2)
 */
function autoInferFromKeywords(text = "") {
  text = text.toLowerCase();

  const extracted = [];
  const inferred = [];

  const keywordMap = {
    javascript: "Programming Language",
    react: "Frontend Framework",
    node: "Backend Runtime",
    sql: "Database Query Language",
    api: "API Integration",
  };

  for (const key in keywordMap) {
    if (text.includes(key)) {
      extracted.push({ skill: key });
      inferred.push({
        skill: keywordMap[key],
        reason: `Detected keyword "${key}" in resume text.`,
      });
    }
  }

  return { extractedSkills: extracted, inferredSkills: inferred };
}

/**
 * Detect highest education when missing
 */
function detectEducation(text = "") {
  const T = text.toLowerCase();

  if (T.includes("bachelor") || T.includes("b.tech") || T.includes("bsc"))
    return "Bachelor's";

  if (T.includes("master") || T.includes("m.tech") || T.includes("msc"))
    return "Master's";

  if (T.includes("12th") || T.includes("higher secondary"))
    return "High School";

  return "Unknown";
}

/*
Fallback-1 → Raw summary

If AI gives empty summary → generate minimal human-safe summary.

Fallback-2 → No skills found

If both skill arrays empty → auto-infer using safe keywords.

Fallback-3 → Education

If missing → use safe heuristics.
*/
