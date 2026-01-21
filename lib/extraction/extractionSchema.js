export const EMPTY_EXTRACTION_SCHEMA = {
  rawSummary: "",
  extractedSkills: [{ skill: "" }],
  inferredSkills: [{ skill: "", reason: "" }],
  experienceYears: null,
  educationLevel: "",
  tools: [],
  projects: [],
};

export function repairExtractionSchema(result) {
  if (!result || typeof result !== "object") {
    return { ...EMPTY_EXTRACTION_SCHEMA };
  }

  return {
    rawSummary: result.rawSummary || "",
    extractedSkills: Array.isArray(result.extractedSkills)
      ? result.extractedSkills
          .filter((s) => s && typeof s.skill === "string")
          .map((s) => ({ skill: s.skill.trim() }))
      : [],

    inferredSkills: Array.isArray(result.inferredSkills)
      ? result.inferredSkills
          .filter((s) => s && typeof s.skill === "string")
          .map((s) => ({
            skill: s.skill.trim(),
            reason: s.reason || "",
          }))
      : [],

    experienceYears:
      typeof result.experienceYears === "number"
        ? result.experienceYears
        : null,

    educationLevel:
      typeof result.educationLevel === "string"
        ? result.educationLevel.trim()
        : "",

    tools:
      Array.isArray(result.tools) &&
      result.tools.every((t) => typeof t === "string")
        ? result.tools
        : [],

    projects:
      Array.isArray(result.projects) &&
      result.projects.every((p) => typeof p === "string")
        ? result.projects
        : [],
  };
}
