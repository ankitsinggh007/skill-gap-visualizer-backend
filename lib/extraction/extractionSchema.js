export const EMPTY_EXTRACTION_SCHEMA = {
  extractedSkills: [],
  inferredSkills: [],
};

const DEFAULT_INFERRED_SOURCE = "Extracted from text";

export function repairExtractionSchema(result) {
  if (!result || typeof result !== "object") {
    return { ...EMPTY_EXTRACTION_SCHEMA };
  }

  return {
    extractedSkills: Array.isArray(result.extractedSkills)
      ? result.extractedSkills
          .filter((s) => s && typeof s.skill === "string" && s.skill.trim())
          .map((s) => ({ skill: s.skill.trim().toLowerCase() }))
      : [],

    inferredSkills: Array.isArray(result.inferredSkills)
      ? result.inferredSkills
          .filter((s) => s && typeof s.skill === "string" && s.skill.trim())
          .map((s) => {
            // Ensure source is non-empty; use default if missing or empty
            const source = (s.source || s.reason || "").trim();
            return {
              skill: s.skill.trim(),
              source: source || DEFAULT_INFERRED_SOURCE,
            };
          })
      : [],
  };
}
