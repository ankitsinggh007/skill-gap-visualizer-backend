// /api/analyze-resume.js
import { analyzeResume } from "../lib/analyze/index.js";
import { HTTP_ERRORS, sendError } from "../lib/http/error.js";

/**
 * Vercel Serverless API Route
 * Method: POST
 * Contract: {metadata, matches, analysis}
 * Input: { resumeText, extractedSkills, inferredSkills }
 * Output: Exact contract response (no success wrapper)
 *
 * Note: role, level, companyType, and experienceYears are hardcoded (not configurable)
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

    const { resumeText, extractedSkills = [], inferredSkills = [] } = body;

    // Validation
    if (!resumeText || typeof resumeText !== "string") {
      return sendError(
        res,
        HTTP_ERRORS.VALIDATION_ERROR,
        "resumeText is required and must be a string",
        { received: typeof resumeText },
      );
    }

    // Hardcoded defaults (not configurable per contract)
    const role = "react";
    const level = "junior";
    const companyType = "unicorn";
    const experienceYears = 0;

    // Call the orchestrator (Layer A → B → C → D)
    const result = await analyzeResume({
      resumeText,
      extractedSkills,
      inferredSkills,
      role,
      level,
      companyType,
      experienceYears,
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
