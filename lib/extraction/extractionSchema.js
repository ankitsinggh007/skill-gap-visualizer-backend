export const EMPTY_EXTRACTION_SCHEMA = {
  extractedSkills: [],
  inferredSkills: [],
  experienceYears: null,
  educationLevel: "",
  tools: [],
  projects: [],
  rawSummary: "",
};

const DEFAULT_INFERRED_SOURCE = "Extracted from text";
const MAX_ARRAY_ITEMS = 1000;
const MAX_STRING_LENGTH = 500;
const MAX_SUMMARY_LENGTH = 1000;

function clampString(value, maxLen) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

function clampStringArray(value, maxItems, maxLen) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    const cleaned = clampString(item, maxLen);
    if (cleaned) out.push(cleaned);
    if (out.length >= maxItems) break;
  }
  return out;
}

function clampExperienceYears(value) {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(num)) return null;
  const clamped = Math.min(50, Math.max(0, num));
  return Math.round(clamped * 10) / 10;
}

export function repairExtractionSchema(result) {
  if (!result || typeof result !== "object") {
    return { ...EMPTY_EXTRACTION_SCHEMA };
  }

  const extractedSkills = Array.isArray(result.extractedSkills)
    ? result.extractedSkills
        .filter((s) => s && typeof s.skill === "string" && s.skill.trim())
        .map((s) => ({ skill: s.skill.trim().toLowerCase() }))
        .slice(0, MAX_ARRAY_ITEMS)
        .filter((s) => s.skill.length <= MAX_STRING_LENGTH)
    : [];

  const inferredSkills = Array.isArray(result.inferredSkills)
    ? result.inferredSkills
        .filter((s) => s && typeof s.skill === "string" && s.skill.trim())
        .map((s) => {
          const source = clampString(s.source || s.reason || "", MAX_STRING_LENGTH);
          return {
            skill: s.skill.trim(),
            source: source || DEFAULT_INFERRED_SOURCE,
          };
        })
        .slice(0, MAX_ARRAY_ITEMS)
        .filter(
          (s) =>
            s.skill.length <= MAX_STRING_LENGTH &&
            s.source.length <= MAX_STRING_LENGTH,
        )
    : [];

  return {
    extractedSkills,
    inferredSkills,
    experienceYears: clampExperienceYears(result.experienceYears),
    educationLevel: clampString(result.educationLevel, MAX_STRING_LENGTH),
    tools: clampStringArray(result.tools, MAX_ARRAY_ITEMS, MAX_STRING_LENGTH),
    projects: clampStringArray(result.projects, MAX_ARRAY_ITEMS, MAX_STRING_LENGTH),
    rawSummary: clampString(result.rawSummary, MAX_SUMMARY_LENGTH),
  };
}
