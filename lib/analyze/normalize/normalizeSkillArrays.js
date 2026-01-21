/**
 * Validate and sanitize skill arrays for analysis
 *
 * extractedSkills: array of { skill: string }
 * inferredSkills: array of { skill: string, source: string }
 *
 * Throws structured error with index + reason on first invalid item
 */

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

    // Trim skill and check for empty
    const trimmedSkill = item.skill.trim();
    if (trimmedSkill === "") {
      // Skip empty entries
      continue;
    }

    // Trim source
    const trimmedSource = item.source.trim();

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
