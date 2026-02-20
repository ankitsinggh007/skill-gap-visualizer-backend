import { applyFallbacks } from "../fallbacks.js";
import {
  EMPTY_EXTRACTION_SCHEMA,
  repairExtractionSchema,
} from "../extractionSchema.js";
import { buildExtractionPrompt } from "../buildExtractionPrompt.js";
import { attemptJsonFixWithStatus } from "../attemptJsonFix.js";
import { classifyOpenAIError } from "./classifyOpenAIError.js";

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryConfig(overrides = {}) {
  const maxRetriesRaw = Number(process.env.OPENAI_EXTRACTION_RETRIES);
  const backoffRaw = Number(process.env.OPENAI_EXTRACTION_BACKOFF_MS);

  const maxRetriesEnv = Number.isFinite(maxRetriesRaw)
    ? Math.max(0, Math.min(5, maxRetriesRaw))
    : DEFAULT_MAX_RETRIES;
  const backoffEnv = Number.isFinite(backoffRaw)
    ? Math.max(50, Math.min(2000, backoffRaw))
    : DEFAULT_BACKOFF_MS;

  const maxRetries =
    typeof overrides.maxRetries === "number"
      ? Math.max(0, Math.min(5, overrides.maxRetries))
      : maxRetriesEnv;
  const backoffMs =
    typeof overrides.backoffMs === "number"
      ? Math.max(0, Math.min(2000, overrides.backoffMs))
      : backoffEnv;

  return { maxRetries, backoffMs };
}

function getJitter(attempt) {
  const base = 1 + attempt * 0.5;
  const jitter = Math.random() * 0.3 + 0.85;
  return base * jitter;
}

async function defaultCallOpenAIOnce(rawText) {
  const { default: OpenAI } = await import("openai");
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

  const raw = response.choices[0]?.message?.content || "";

  let parsed;
  let parseError = false;

  try {
    parsed = JSON.parse(raw);
  } catch {
    const fixed = attemptJsonFixWithStatus(raw);
    parsed = fixed.parsed;
    parseError = !fixed.ok;
  }

  const repaired = repairExtractionSchema(parsed);

  return {
    result: repaired,
    parseError,
  };
}

export function createOpenAIExtractionRunner({
  callOpenAIOnce = defaultCallOpenAIOnce,
  classifyError = classifyOpenAIError,
  applyFallback = applyFallbacks,
  emptySchema = EMPTY_EXTRACTION_SCHEMA,
  sleepFn = sleep,
  maxRetries,
  backoffMs,
} = {}) {
  return async function runOpenAIExtraction(rawText) {
    const { maxRetries: maxR, backoffMs: backoff } = getRetryConfig({
      maxRetries,
      backoffMs,
    });
    let lastError;

    for (let attempt = 0; attempt <= maxR; attempt++) {
      try {
        const { result, parseError } = await callOpenAIOnce(rawText);

        if (parseError) {
          const fallback = applyFallback({ ...emptySchema }, rawText);
          return { ...fallback, extractionSource: "fallback" };
        }

        const final = applyFallback(result, rawText);
        return { ...final, extractionSource: "openai" };
      } catch (err) {
        lastError = err;
        const decision = classifyError(err);

        if (decision.action === "retry") {
          if (attempt < maxR) {
            const waitMs = Math.round(backoff * getJitter(attempt));
            await sleepFn(waitMs);
            continue;
          }
          const fallback = applyFallback({ ...emptySchema }, rawText);
          return { ...fallback, extractionSource: "fallback" };
        }

        if (decision.action === "fallback") {
          console.warn(
            `OpenAI extraction fallback (${decision.category}):`,
            decision.code || decision.status || "unknown",
          );
          const fallback = applyFallback({ ...emptySchema }, rawText);
          return { ...fallback, extractionSource: "fallback" };
        }

        throw err;
      }
    }

    throw lastError;
  };
}

export const runOpenAIExtraction = createOpenAIExtractionRunner();
