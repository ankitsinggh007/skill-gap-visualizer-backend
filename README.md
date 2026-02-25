# Skill Gap Visualizer (Backend)

A lightweight backend that extracts resume signals and scores them against a target role. Built to be clear, testable, and production‑minded without over‑engineering.

## What this does

- Extracts structured skills and signals from raw resume text
- Scores alignment against a target role/level/company type using benchmark JSON files in `lib/benchmark`
- Returns a stable JSON contract designed for a frontend UI

## Why I built it

I started this to keep the OpenAI key off the client. As the project grew, I moved the scoring and logic into the backend so the core approach isn’t just sitting in frontend code, and to avoid heavy compute on the browser thread. I still wanted the backend to be small enough to understand end‑to‑end while following real‑world patterns: contract tests, predictable error handling, and guardrails around LLM usage.

## Features

- LLM extraction with fallback heuristics
- Stable response contracts with schema checks
- Deterministic test suite for critical flows
- Payload size limits to protect the model and server
- Clear error taxonomy for OpenAI failures

## Architecture (high level)

- `POST /api/extract` → returns structured extraction
- `POST /api/analyze-resume` → returns score + insights
- OpenAI failure handling includes retry, fallback, and classification

## API Contract (short)

For full details, see `docs/CONTRACT.md`.

### POST /api/extract

```json
{
  "resumeText": "..."
}
```

Response (shape only):

```json
{
  "extractedSkills": [{ "skill": "..." }],
  "inferredSkills": [{ "skill": "...", "source": "..." }],
  "experienceYears": 0,
  "educationLevel": "...",
  "tools": [],
  "projects": [],
  "rawSummary": "...",
  "extractionSource": "openai"
}
```

### POST /api/analyze-resume

```json
{
  "resumeText": "...",
  "extractedSkills": [{ "skill": "..." }],
  "inferredSkills": [{ "skill": "...", "source": "..." }]
}
```

Response (shape only):

```json
{
  "metadata": {
    "role": "...",
    "level": "...",
    "companyType": "...",
    "jobCount": 0
  },
  "matches": { "matchedSkills": [] },
  "analysis": {
    "finalScore": 0,
    "categoryScores": [],
    "insights": [],
    "strengthWeakness": {},
    "atsReadiness": {},
    "recommendations": []
  }
}
```

## Reliability and guardrails

- Contract tests verify error codes and response shapes
- Determinism checks ensure stable outputs in fallback mode
- Payload limits prevent oversized LLM requests
- OpenAI errors are classified and handled consistently

## Local setup

```bash
npm install
cp .env.example .env
```

Required env vars:

- `OPENAI_API_KEY`
- `ENABLE_OPENAI_EXTRACTION=true`
- `OPENAI_EXTRACTION_RETRIES=2`
- `OPENAI_EXTRACTION_BACKOFF_MS=200`

Optional (rate limiting at edge):

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RATE_LIMIT_MAX=5`
- `RATE_LIMIT_WINDOW_S=600`

Optional (Turnstile CAPTCHA):

- `TURNSTILE_SECRET_KEY` (backend)
- `TURNSTILE_SITE_KEY` (frontend)

Optional (CORS allowlist):

- `CORS_ALLOWED_ORIGINS` (comma-separated list of allowed origins)

## Tests

```bash
npm run test:openai:e2e
npm run test:endpoints
npm run test:openai:errors
```

## Deployment (Vercel)

- Set the same env vars in the Vercel project
- Deploy
- Smoke test `/api/extract` and `/api/analyze-resume`

## Security Checklist (Deploy Time)

- Rate limit `/api/extract` and `/api/analyze-resume` at the edge (Vercel Middleware + Upstash/Vercel KV); return `429` when exceeded
- Add Turnstile CAPTCHA on the frontend and verify the token in `/api/extract` (blocks automated abuse)
- Set OpenAI daily/monthly budget caps in the OpenAI dashboard (hard spend limit)

## Roadmap

- Improve skill normalization and synonym mapping
- Add stronger rate‑limit protection at the edge
- Expand ATS keyword readiness checks

## Notes

This project is intentionally scoped. It aims to be clean, reliable, and easy to reason about rather than feature‑heavy.

## License

MIT
