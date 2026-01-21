// /api/extract.js

import { runExtractionEngine } from "../lib/extraction/extractorEngine.js";
import { HTTP_ERRORS, sendError } from "../lib/http/error.js";

const MAX_RESUME_CHARS = 100_000;

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
    const { resumeText } = body;

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

    // Return only the locked contract fields
    return res.status(200).json({
      extractedSkills: result.extractedSkills,
      inferredSkills: result.inferredSkills,
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
