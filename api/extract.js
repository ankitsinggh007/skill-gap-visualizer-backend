// /api/extract.js

import { runExtractionEngine } from "../lib/extraction/extractorEngine.js";
import { verifyTurnstileToken } from "../lib/security/verifyTurnstile.js";
import { HTTP_ERRORS, sendError } from "../lib/http/error.js";

const MAX_RESUME_CHARS = 30_000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendError(
      res,
      HTTP_ERRORS.METHOD_NOT_ALLOWED,
      "Only POST method is allowed",
      { method: req.method },
    );
  }

  try {
    const body = req.body || {};
    const { resumeText, turnstileToken } = body;

    if (process.env.TURNSTILE_SECRET_KEY) {
      const ipHeader = req.headers["x-forwarded-for"];
      const ip =
        typeof ipHeader === "string"
          ? ipHeader.split(",")[0].trim()
          : req.socket?.remoteAddress;

      const verification = await verifyTurnstileToken(turnstileToken, ip);
      if (!verification.ok) {
        const reason =
          verification.reason === "missing_token"
            ? "Turnstile token is required"
            : "Turnstile verification failed";
        return sendError(res, HTTP_ERRORS.VALIDATION_ERROR, reason, {
          reason: verification.reason,
          codes: verification.codes,
        });
      }
    }

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

    const result = await runExtractionEngine(resumeText);

    // Return extraction contract fields
    return res.status(200).json({
      extractedSkills: result.extractedSkills,
      inferredSkills: result.inferredSkills,
      experienceYears: result.experienceYears,
      educationLevel: result.educationLevel,
      tools: result.tools,
      projects: result.projects,
      rawSummary: result.rawSummary,
      extractionSource: result.extractionSource || "fallback",
    });
  } catch (err) {
    console.error("Extract API error:", err);
    return sendError(
      res,
      HTTP_ERRORS.INTERNAL_ERROR,
      "Internal server error during extraction",
      {},
    );
  }
}
