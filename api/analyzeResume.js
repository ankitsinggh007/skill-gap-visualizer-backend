// /api/analyzeResume.js
import { analyzeResume } from "../lib/analyze/index.js";

/**
 * Vercel Serverless API Route
 * Method: POST
 * Input: { resumeText, extractedSkills, inferredSkills, role, level, companyType, experienceYears }
 * Output: Full analysis JSON
 */
export default async function handler(req, res) {
  try {
    // Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method Not Allowed",
        message: "Use POST /api/analyzeResume",
      });
    }

    // Parse JSON body
    const body = req.body || {};

    const {
      resumeText,
      extractedSkills = [],
      inferredSkills = [],
      role = "react",
      level = "junior",
      companyType = "unicorn",
      experienceYears = 0,
    } = body;

    // Validation
    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({
        error: "resumeText is required and must be a string.",
      });
    }

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

    // Return final JSON
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("❌ analyzeResume API Error:", err);

    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  }
}
