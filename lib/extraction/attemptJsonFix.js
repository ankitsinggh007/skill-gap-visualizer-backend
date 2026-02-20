import { EMPTY_EXTRACTION_SCHEMA } from "./extractionSchema.js";

export function attemptJsonFixWithStatus(str) {
  if (!str) {
    return { parsed: { ...EMPTY_EXTRACTION_SCHEMA }, ok: false };
  }

  try {
    const cleaned = str.replace(/```json|```/g, "");
    return { parsed: JSON.parse(cleaned), ok: true };
  } catch {
    return { parsed: { ...EMPTY_EXTRACTION_SCHEMA }, ok: false };
  }
}

export function attemptJsonFix(str) {
  return attemptJsonFixWithStatus(str).parsed;
}
