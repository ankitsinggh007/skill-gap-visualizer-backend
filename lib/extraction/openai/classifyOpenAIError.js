const NETWORK_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
]);

const RATE_LIMIT_CODES = new Set(["rate_limit_exceeded", "insufficient_quota"]);
const AUTH_CODES = new Set([
  "invalid_api_key",
  "authentication_error",
  "permission_denied",
  "organization_restricted",
]);
const INVALID_REQUEST_CODES = new Set([
  "invalid_request_error",
  "model_not_found",
  "response_format_invalid",
]);
const SAFETY_CODES = new Set([
  "content_policy_violation",
  "safety_error",
  "policy_violation",
]);

export function classifyOpenAIError(err) {
  const status = err?.status ?? err?.response?.status ?? null;
  const code = err?.code ?? err?.error?.code ?? null;
  const type = err?.type ?? err?.error?.type ?? null;
  const message = String(err?.message || "").toLowerCase();

  // Auth / permission issues => hard fail
  if (status === 401 || status === 403 || AUTH_CODES.has(code)) {
    return { category: "auth", action: "throw", status, code, type };
  }

  // Invalid request / configuration => hard fail
  if (
    status === 400 ||
    status === 404 ||
    status === 422 ||
    INVALID_REQUEST_CODES.has(code)
  ) {
    return { category: "invalid_request", action: "throw", status, code, type };
  }

  // Rate limit / quota => fallback
  if (status === 429 || RATE_LIMIT_CODES.has(code)) {
    return { category: "rate_limit", action: "fallback", status, code, type };
  }

  // Safety / policy => fallback
  if (SAFETY_CODES.has(code) || (type && String(type).includes("safety"))) {
    return { category: "safety", action: "fallback", status, code, type };
  }

  // Transient availability => retry
  if (
    status >= 500 ||
    NETWORK_ERROR_CODES.has(code) ||
    message.includes("timeout") ||
    message.includes("temporarily unavailable")
  ) {
    return { category: "transient", action: "retry", status, code, type };
  }

  // Unknown => fallback to keep site running
  return { category: "unknown", action: "fallback", status, code, type };
}
