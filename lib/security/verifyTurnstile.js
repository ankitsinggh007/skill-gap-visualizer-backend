const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function buildFormData(secret, token, ip) {
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  return body;
}

export async function verifyTurnstileToken(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing_token", codes: [] };
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: buildFormData(secret, token, ip),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: "verify_failed",
      status: response.status,
      codes: data?.["error-codes"] || [],
    };
  }

  if (data?.success) {
    return { ok: true, codes: data?.["error-codes"] || [] };
  }

  return {
    ok: false,
    reason: "invalid_token",
    codes: data?.["error-codes"] || [],
  };
}
