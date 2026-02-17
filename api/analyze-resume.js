// /api/analyze-resume.js
import { analyzeResume } from "../lib/analyze/index.js";
import {
  loadBenchmark,
  listSupportedBenchmarks,
} from "../lib/benchmark/loader.js";
import { HTTP_ERRORS, sendError } from "../lib/http/error.js";
import {
  normalizeSkillArrays,
  SkillArrayError,
} from "../lib/analyze/normalize/normalizeSkillArrays.js";

const MAX_RESUME_CHARS = 200_000;
const SUPPORTED_BENCHMARKS = listSupportedBenchmarks();
const DEFAULT_BENCHMARK = SUPPORTED_BENCHMARKS.combinations[0] || {
  role: "react",
  level: "junior",
  companyType: "unicorn",
};
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Vercel Serverless API Route
 * Method: POST
 * Contract: {metadata, matches, analysis}
 * Input: { resumeText, extractedSkills, inferredSkills }
 * Output: Exact contract response (no success wrapper)
 *
 * Note: role, level, companyType, and experienceYears are configurable (not hardcoded)
 */
export default async function handler(req, res) {
  try {
    // Only allow POST
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendError(
        res,
        HTTP_ERRORS.METHOD_NOT_ALLOWED,
        "Use POST /api/analyze-resume",
        { method: req.method },
      );
    }

    // Parse JSON body
    const body = req.body || {};

    const {
      resumeText,
      extractedSkills = [],
      inferredSkills = [],
      experienceYears = 0,
    } = body;
    // configurable defaults (not hardcoded per contract)
    const role = hasOwn(body, "role") ? body.role : DEFAULT_BENCHMARK.role;
    const level = hasOwn(body, "level") ? body.level : DEFAULT_BENCHMARK.level;
    const companyType = hasOwn(body, "companyType")
      ? body.companyType
      : DEFAULT_BENCHMARK.companyType;
    const parsedYears = Number.isFinite(Number(experienceYears))
      ? Number(experienceYears)
      : 0;
    const safeExperienceYears = Math.min(50, Math.max(0, parsedYears));

    // Validation
    if (!resumeText || typeof resumeText !== "string") {
      return sendError(
        res,
        HTTP_ERRORS.VALIDATION_ERROR,
        "resumeText is required and must be a string",
        { received: typeof resumeText },
      );
    }

    if (resumeText.length > MAX_RESUME_CHARS) {
      return sendError(
        res,
        HTTP_ERRORS.PAYLOAD_TOO_LARGE,
        `resumeText exceeds maximum size of ${MAX_RESUME_CHARS} characters`,
        { maxChars: MAX_RESUME_CHARS, receivedChars: resumeText.length },
      );
    }

    if (hasOwn(body, "role") && typeof role !== "string") {
      return sendError(
        res,
        HTTP_ERRORS.VALIDATION_ERROR,
        "role must be a string",
        {
          field: "role",
          received: role,
          supportedRoles: SUPPORTED_BENCHMARKS.roles,
        },
      );
    }

    if (hasOwn(body, "level") && typeof level !== "string") {
      return sendError(
        res,
        HTTP_ERRORS.VALIDATION_ERROR,
        "level must be a string",
        {
          field: "level",
          received: level,
          supportedLevels: SUPPORTED_BENCHMARKS.levels,
        },
      );
    }

    if (hasOwn(body, "companyType") && typeof companyType !== "string") {
      return sendError(
        res,
        HTTP_ERRORS.VALIDATION_ERROR,
        "companyType must be a string",
        {
          field: "companyType",
          received: companyType,
          supportedCompanyTypes: SUPPORTED_BENCHMARKS.companyTypes,
        },
      );
    }

    if (!SUPPORTED_BENCHMARKS.roles.includes(role)) {
      return sendError(res, HTTP_ERRORS.VALIDATION_ERROR, "Unsupported role", {
        field: "role",
        received: role,
        supportedRoles: SUPPORTED_BENCHMARKS.roles,
        supportedCombinations: SUPPORTED_BENCHMARKS.combinations,
      });
    }

    if (!SUPPORTED_BENCHMARKS.levels.includes(level)) {
      return sendError(res, HTTP_ERRORS.VALIDATION_ERROR, "Unsupported level", {
        field: "level",
        received: level,
        supportedLevels: SUPPORTED_BENCHMARKS.levels,
        supportedCombinations: SUPPORTED_BENCHMARKS.combinations,
      });
    }

    if (!SUPPORTED_BENCHMARKS.companyTypes.includes(companyType)) {
      return sendError(
        res,
        HTTP_ERRORS.VALIDATION_ERROR,
        "Unsupported companyType",
        {
          field: "companyType",
          received: companyType,
          supportedCompanyTypes: SUPPORTED_BENCHMARKS.companyTypes,
          supportedCombinations: SUPPORTED_BENCHMARKS.combinations,
        },
      );
    }

    if (!loadBenchmark(role, level, companyType)) {
      return sendError(
        res,
        HTTP_ERRORS.VALIDATION_ERROR,
        "Unsupported benchmark selection",
        {
          role,
          level,
          companyType,
          supportedCombinations: SUPPORTED_BENCHMARKS.combinations,
        },
      );
    }

    // Validate and normalize skill arrays
    let normalizedSkills;
    try {
      normalizedSkills = normalizeSkillArrays({
        extractedSkills,
        inferredSkills,
      });
    } catch (err) {
      if (err instanceof SkillArrayError) {
        return sendError(
          res,
          HTTP_ERRORS.BAD_REQUEST,
          "Invalid skills input",
          err.details,
        );
      }
      // Re-throw unknown errors to be caught by outer try/catch
      throw err;
    }

    // Call the orchestrator (Layer A → B → C → D)
    const result = await analyzeResume({
      resumeText,
      extractedSkills: normalizedSkills.extractedSkills,
      inferredSkills: normalizedSkills.inferredSkills,
      role,
      level,
      companyType,
      experienceYears: safeExperienceYears,
    });

    // Check for errors from orchestrator
    if (result.error) {
      return sendError(res, HTTP_ERRORS.BAD_REQUEST, "Invalid analysis input", {
        engineError:
          typeof result.error === "string"
            ? result.error.slice(0, 500)
            : result.error,
      });
    }

    // Return exact contract (no success wrapper)
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ analyze-resume API Error:", err);

    return sendError(
      res,
      HTTP_ERRORS.INTERNAL_ERROR,
      "Internal server error during analysis",
      {},
    );
  }
}
