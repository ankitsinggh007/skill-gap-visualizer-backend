# RUNBOOK (Backend)

**Overview**
This backend is a Vercel Serverless Functions project. Endpoints live under `api/` and are deployed to Vercel as `/api/*`.

**Local Run**
Install dependencies:
```bash
npm install
```

Option A (recommended for local verification): run contract tests that invoke the handlers directly:
```bash
node tests/contract-smoke.test.js
node tests/final-acceptance.mjs
```

Option B (manual endpoint testing): run a local Vercel dev server (requires Vercel CLI installed and configured):
```bash
vercel dev
```

**Environment Variables**
Required only if OpenAI extraction is enabled:
- `ENABLE_OPENAI_EXTRACTION` (default: `false`)
- `OPENAI_API_KEY` (required when `ENABLE_OPENAI_EXTRACTION=true`)

No other environment variables are used by this backend.

**Tests**
Common commands:
```bash
node tests/contract-smoke.test.js
node tests/final-acceptance.mjs
```

Optional scripts in `package.json`:
```bash
npm run test:contract
npm run test:extract
npm run test:fixtures
npm run test:brain
```

**Deploy Notes (Vercel)**
- Node version: `22.x` (matches `package.json` engines)
- Ensure `vercel.json` is deployed so benchmarks and dictionaries are bundled (`includeFiles`)
- Set environment variables in Vercel only if enabling OpenAI extraction
- There is no auth and no storage; endpoints are publicly callable by default
