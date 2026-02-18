/**
 * Validate and sanitize skill arrays for analysis
 *
 * extractedSkills: array of { skill: string }
 * inferredSkills: array of { skill: string, source: string }
 *
 * Enforces:
 * - Array size limits (max 1000 items per array)
 * - Per-item string length limits (max 500 chars)
 * - Non-empty source for inferredSkills (required input for /api/analyze-resume)
 *
 * Throws structured error with index + reason on first invalid item
 */

const MAX_SKILL_ARRAY_SIZE = 1000;
const MAX_SKILL_STRING_LENGTH = 500;

export function normalizeSkillArrays({ extractedSkills, inferredSkills }) {
  // Validate extractedSkills
  const normalized_extracted = normalizeExtractedSkills(extractedSkills);

  // Validate inferredSkills
  const normalized_inferred = normalizeInferredSkills(inferredSkills);

  return {
    extractedSkills: normalized_extracted,
    inferredSkills: normalized_inferred,
  };
}

function normalizeExtractedSkills(arr) {
  if (!Array.isArray(arr)) {
    throw new SkillArrayError("extractedSkills must be an array", {
      received: typeof arr,
      index: null,
    });
  }

  // Check array size limit
  if (arr.length > MAX_SKILL_ARRAY_SIZE) {
    throw new SkillArrayError(
      `extractedSkills exceeds maximum size of ${MAX_SKILL_ARRAY_SIZE} items`,
      {
        received: arr.length,
        maxSize: MAX_SKILL_ARRAY_SIZE,
      },
    );
  }

  const result = [];

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];

    // Must be an object
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new SkillArrayError("extractedSkills item must be an object", {
        index: i,
        received: Array.isArray(item) ? "array" : typeof item,
      });
    }

    // Must have 'skill' property
    if (!("skill" in item)) {
      throw new SkillArrayError(
        "extractedSkills item missing 'skill' property",
        { index: i, reason: "missing_skill_property" },
      );
    }

    // skill must be a string
    if (typeof item.skill !== "string") {
      throw new SkillArrayError("extractedSkills[].skill must be a string", {
        index: i,
        received: typeof item.skill,
      });
    }

    // Trim and check for empty
    const trimmed = item.skill.trim();
    if (trimmed === "") {
      // Skip empty entries
      continue;
    }

    // Check string length limit
    if (trimmed.length > MAX_SKILL_STRING_LENGTH) {
      throw new SkillArrayError(
        `extractedSkills[${i}].skill exceeds maximum length of ${MAX_SKILL_STRING_LENGTH} characters`,
        {
          index: i,
          received: trimmed.length,
          maxLength: MAX_SKILL_STRING_LENGTH,
        },
      );
    }

    // Normalize: trim + lowercase
    result.push({
      skill: trimmed.toLowerCase(),
    });
  }

  return result;
}

function normalizeInferredSkills(arr) {
  if (!Array.isArray(arr)) {
    throw new SkillArrayError("inferredSkills must be an array", {
      received: typeof arr,
      index: null,
    });
  }

  // Check array size limit
  if (arr.length > MAX_SKILL_ARRAY_SIZE) {
    throw new SkillArrayError(
      `inferredSkills exceeds maximum size of ${MAX_SKILL_ARRAY_SIZE} items`,
      {
        received: arr.length,
        maxSize: MAX_SKILL_ARRAY_SIZE,
      },
    );
  }

  const result = [];

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];

    // Must be an object
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new SkillArrayError("inferredSkills item must be an object", {
        index: i,
        received: Array.isArray(item) ? "array" : typeof item,
      });
    }

    // Must have 'skill' property
    if (!("skill" in item)) {
      throw new SkillArrayError(
        "inferredSkills item missing 'skill' property",
        { index: i, reason: "missing_skill_property" },
      );
    }

    // skill must be a string
    if (typeof item.skill !== "string") {
      throw new SkillArrayError("inferredSkills[].skill must be a string", {
        index: i,
        received: typeof item.skill,
      });
    }

    // Trim skill and check for empty
    const trimmedSkill = item.skill.trim();
    if (trimmedSkill === "") {
      // Skip empty entries
      continue;
    }

    // Check skill string length limit
    if (trimmedSkill.length > MAX_SKILL_STRING_LENGTH) {
      throw new SkillArrayError(
        `inferredSkills[${i}].skill exceeds maximum length of ${MAX_SKILL_STRING_LENGTH} characters`,
        {
          index: i,
          received: trimmedSkill.length,
          maxLength: MAX_SKILL_STRING_LENGTH,
        },
      );
    }

    // Must have 'source' property
    if (!("source" in item)) {
      throw new SkillArrayError(
        "inferredSkills item missing 'source' property",
        { index: i, reason: "missing_source_property" },
      );
    }

    // source must be a string
    if (typeof item.source !== "string") {
      throw new SkillArrayError("inferredSkills[].source must be a string", {
        index: i,
        received: typeof item.source,
      });
    }

    // Trim source
    const trimmedSource = item.source.trim();

    // Reject empty source strings
    if (!trimmedSource) {
      throw new SkillArrayError(
        `inferredSkills[${i}].source must be non-empty`,
        {
          index: i,
          received: item.source,
        },
      );
    }

    // Check source string length limit
    if (trimmedSource.length > MAX_SKILL_STRING_LENGTH) {
      throw new SkillArrayError(
        `inferredSkills[${i}].source exceeds maximum length of ${MAX_SKILL_STRING_LENGTH} characters`,
        {
          index: i,
          received: trimmedSource.length,
          maxLength: MAX_SKILL_STRING_LENGTH,
        },
      );
    }

    // Normalize: trim skill (keep casing), trim source
    result.push({
      skill: trimmedSkill,
      source: trimmedSource,
    });
  }

  return result;
}

/**
 * Custom error for skill array validation
 */
export class SkillArrayError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "SkillArrayError";
    this.details = details;
  }
}
