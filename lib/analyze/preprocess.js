// -----------------------------
// Layer A — Resume Preprocessing
// -----------------------------

// import { norm } from "./matchEngine";

/**
 * Normalizes resume text for consistent matching:
 * - Lowercases everything
 * - Removes punctuation
 * - Collapses whitespace
 * - Keeps numbers (important for "2 years experience", "React 18")
 */
export function normalizeText(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // remove punctuation
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

/**
 * Tokenizes text into array of words.
 * We avoid naive split(" ") because:
 * - multiple spaces collapse
 * - punctuation removed earlier
 */
export function tokenize(text) {
  if (!text) return [];
  return text.split(" ").filter(Boolean);
}

/**
 * Builds a frequency map of all tokens.
 * Example:
 *   "react react hooks"
 * → { react: 2, hooks: 1 }
 */
export function buildFrequencyMap(tokens) {
  const freq = Object.create(null);

  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }

  return freq;
}

/**
 * Entry point for Layer A.
 * Returns a preprocessed resume model.
 */
export function preprocessResume(resumeText) {
  const normalizedText = normalizeText(resumeText);
  const tokens = tokenize(normalizedText);
  const frequencyMap = buildFrequencyMap(tokens);
  return {
    normalizedText,
    tokens,
    frequencyMap,
  };
}
