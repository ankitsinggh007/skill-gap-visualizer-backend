// /api/extract.js

import { runExtractionEngine } from "../lib/extraction/extractorEngine.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { resumeText } = req.body;

    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({ error: "Invalid resumeText" });
    }

    const result = await runExtractionEngine(resumeText);

    return res.status(200).json(result);
  } catch (err) {
    console.error("Serverless error:", err);
    return res
      .status(500)
      .json({ error: "Server error", message: err.message });
  }
}
