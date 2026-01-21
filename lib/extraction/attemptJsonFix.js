import { EMPTY_EXTRACTION_SCHEMA } from "./extractionSchema.js";

export function attemptJsonFix(str) {
  if (!str) return { ...EMPTY_EXTRACTION_SCHEMA };

  try {
    const cleaned = str.replace(/```json|```/g, "");
    return JSON.parse(cleaned);
  } catch {
    return { ...EMPTY_EXTRACTION_SCHEMA };
  }
}
