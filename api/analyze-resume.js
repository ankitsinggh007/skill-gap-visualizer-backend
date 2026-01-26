// /api/analyze-resume.js
import { analyzeResume } from "../lib/analyze/index.js";
import { HTTP_ERRORS, sendError } from "../lib/http/error.js";
import {
  normalizeSkillArrays,
  SkillArrayError,
} from "../lib/analyze/normalize/normalizeSkillArrays.js";

const MAX_RESUME_CHARS = 200_000;
const ALLOWED_ROLES = new Set(["react", "frontend", "backend"]);
const ALLOWED_LEVELS = new Set(["junior", "mid", "senior"]);
const ALLOWED_COMPANY_TYPES = new Set(["unicorn", "enterprise", "startup"]);

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
      // configurable defaults (not hardcoded per contract)
      role = "react",
      level = "junior",
      companyType = "unicorn",
      experienceYears = 0,
    } = body;
    const safeRole = ALLOWED_ROLES.has(role) ? role : "react";
    const safeLevel = ALLOWED_LEVELS.has(level) ? level : "junior";
    const safeCompanyType = ALLOWED_COMPANY_TYPES.has(companyType)
      ? companyType
      : "unicorn";
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
      role: safeRole,
      level: safeLevel,
      companyType: safeCompanyType,
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
