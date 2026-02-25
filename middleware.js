import { ipAddress, next } from "@vercel/functions";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const DEFAULT_MAX_REQUESTS = 5;
const DEFAULT_WINDOW_SECONDS = 600;

function getRateLimitConfig() {
  const maxRaw = Number.parseInt(process.env.RATE_LIMIT_MAX || "", 10);
  const windowRaw = Number.parseInt(process.env.RATE_LIMIT_WINDOW_S || "", 10);

  const max = Number.isFinite(maxRaw)
    ? Math.max(1, Math.min(1000, maxRaw))
    : DEFAULT_MAX_REQUESTS;
  const windowSeconds = Number.isFinite(windowRaw)
    ? Math.max(10, Math.min(3600, windowRaw))
    : DEFAULT_WINDOW_SECONDS;

  return { max, windowSeconds };
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const { max: rateLimitMax, windowSeconds: rateLimitWindowSeconds } =
  getRateLimitConfig();

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        rateLimitMax,
        `${rateLimitWindowSeconds} s`,
      ),
      analytics: true,
    })
  : null;

export default async function middleware(request) {
  if (!ratelimit) {
    return next();
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    ipAddress(request) ||
    (forwardedFor ? forwardedFor.split(",")[0].trim() : null) ||
    "unknown";

  const path = new URL(request.url).pathname;
  const { success, limit, remaining, reset } = await ratelimit.limit(
    `ratelimit:${path}:${ip}`,
  );

  if (!success) {
    const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    return new Response(
      JSON.stringify({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
          details: { limit, remaining, reset },
        },
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(retryAfter),
        },
      },
    );
  }

  return next({
    headers: {
      "x-ratelimit-limit": String(limit),
      "x-ratelimit-remaining": String(remaining),
      "x-ratelimit-reset": String(reset),
    },
  });
}

export const config = {
  matcher: ["/api/extract"],
};
