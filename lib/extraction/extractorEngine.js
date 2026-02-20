import {
  EMPTY_EXTRACTION_SCHEMA,
  repairExtractionSchema,
} from "./extractionSchema.js";
import { applyFallbacks } from "./fallbacks.js";
import { runOpenAIExtraction } from "./openai/runOpenAIExtraction.js";

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
    return { ...EMPTY_EXTRACTION_SCHEMA, extractionSource: "fallback" };
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
  return { ...cleaned, extractionSource: "fallback" };
}
