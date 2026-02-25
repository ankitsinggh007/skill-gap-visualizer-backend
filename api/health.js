import { applyCors } from "../lib/http/cors.js";
import { HTTP_ERRORS, sendError } from "../lib/http/error.js";

const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";

export default function health(req, res) {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendError(
      res,
      HTTP_ERRORS.METHOD_NOT_ALLOWED,
      "Only GET method is allowed",
      { method: req.method },
    );
  }

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version,
  });
}
