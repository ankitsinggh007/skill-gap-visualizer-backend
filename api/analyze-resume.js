// /api/analyze-resume.js
import { analyzeResume } from "../lib/analyze/index.js";

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
      return res.status(405).json({
        error: "Method Not Allowed",
        message: "Use POST /api/analyze-resume",
      });
    }

    // Parse JSON body
    const body = req.body || {};

    const { resumeText, extractedSkills = [], inferredSkills = [] } = body;

    // Validation
    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({
        error: "resumeText is required and must be a string.",
      });
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
      return res.status(400).json(result);
    }

    // Return exact contract (no success wrapper)
    return res.status(200).json(result);
  } catch (err) {
    console.error("❌ analyze-resume API Error:", err);

    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  }
}
