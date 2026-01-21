import {
  EMPTY_EXTRACTION_SCHEMA,
  repairExtractionSchema,
} from "./extractionSchema.js";
import { applyFallbacks } from "./fallbacks.js";

/**
 * Extraction engine: disabled OpenAI (deferred phase)
 * Currently uses deterministic fallback/heuristic-only extraction
 *
 * Future: Set ENABLE_OPENAI_EXTRACTION=true to re-enable OpenAI path
 */
const ENABLE_OPENAI_EXTRACTION =
  process.env.ENABLE_OPENAI_EXTRACTION === "true";

export async function runExtractionEngine(rawText) {
  if (!rawText || rawText.trim().length < 20) {
    return { ...EMPTY_EXTRACTION_SCHEMA };
  }

  // OpenAI extraction path (disabled by default)
  if (ENABLE_OPENAI_EXTRACTION) {
    return runOpenAIExtraction(rawText);
  }

  // Fallback: deterministic keyword/heuristic extraction
  const fallbackResult = applyFallbacks(
    {
      ...EMPTY_EXTRACTION_SCHEMA,
      extractedSkills: [],
      inferredSkills: [],
    },
    rawText,
  );
  // Repair schema to clean up placeholders and validate structure
  const cleaned = repairExtractionSchema(fallbackResult);
  return cleaned;
}

/**
 * OpenAI extraction path (disabled by default, requires ENABLE_OPENAI_EXTRACTION=true)
 */
async function runOpenAIExtraction(rawText) {
  try {
    const { default: OpenAI } = await import("openai");
    const { buildExtractionPrompt } =
      await import("./buildExtractionPrompt.js");
    const { attemptJsonFix } = await import("./attemptJsonFix.js");

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = buildExtractionPrompt(rawText);
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      top_p: 0.1,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    let raw = response.choices[0]?.message?.content;
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = attemptJsonFix(raw);
    }

    const repaired = repairExtractionSchema(parsed);
    const final = applyFallbacks(repaired, rawText);
    return final;
  } catch (err) {
    console.error("OpenAI extraction failed (backend):", err);
    console.log("Falling back to heuristic extraction...");
    return applyFallbacks(
      {
        ...EMPTY_EXTRACTION_SCHEMA,
        extractedSkills: [],
        inferredSkills: [],
      },
      rawText,
    );
  }
}
