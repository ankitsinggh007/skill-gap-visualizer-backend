const DEFAULT_ALLOWED_ORIGINS = [
  "https://skill-gap-visualizer.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function applyCors(req, res, options = {}) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    options.methods || "GET, POST, OPTIONS",
  );

  const requestHeaders = req.headers["access-control-request-headers"];
  res.setHeader(
    "Access-Control-Allow-Headers",
    requestHeaders || options.headers || "Content-Type",
  );

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}
