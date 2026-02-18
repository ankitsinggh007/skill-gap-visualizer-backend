# CONTRACT SSOT (Backend)

This document is the single source of truth for the backend contract. Tests and handlers must match it exactly.

**Scope**
In scope:

- API contract for `/api/extract` and `/api/analyze-resume`
- Error shape, status codes, payload limits, determinism guarantees
- Auth and storage statement
- Allowed overrides and supported benchmark combinations

Out of scope:

- New endpoints
- Refactors that are not required for the contract freeze

**Global Constraints**

- Content type: JSON request/response bodies only
- Error envelope: all error responses are exactly `{ "error": { "code", "message", "details" } }`
- Error responses must not include any top-level keys besides `error`
- Determinism: for the same input payload and environment configuration, responses are deterministic (tests repeat 3x)
- `resumeText` max length: `200_000` characters

**Auth And Storage**

- Auth: none
- Storage: none (no database or persistent writes)

**Endpoint: POST /api/extract**
Purpose: Extract skills from raw resume text.

Request body fields:
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `resumeText` | string | yes | Must be a non-empty string, max 200_000 chars |

Success response `200` (exact top-level keys only):

```json
{
  "extractedSkills": [{ "skill": "javascript" }],
  "inferredSkills": [
    {
      "skill": "Frontend Framework",
      "source": "Detected keyword \"react\" in resume text."
    }
  ]
}
```

Field constraints:

- `extractedSkills`: array of `{ "skill": string }`
- `extractedSkills[].skill`: trimmed, lowercase, non-empty
- `inferredSkills`: array of `{ "skill": string, "source": string }`
- `inferredSkills[].skill`: trimmed, casing preserved, non-empty
- `inferredSkills[].source`: trimmed, non-empty

Error responses:
| Status | error.code | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Missing or non-string `resumeText` |
| 405 | `METHOD_NOT_ALLOWED` | Any method other than POST (also sets `Allow: POST`) |
| 413 | `PAYLOAD_TOO_LARGE` | `resumeText` length > 200_000 (details include `maxChars`, `receivedChars`) |
| 500 | `INTERNAL_ERROR` | Unexpected extraction failure |

**Endpoint: POST /api/analyze-resume**
Purpose: Analyze resume skills against a benchmark and return scoring and insights.

Request body fields:
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `resumeText` | string | yes | Must be a non-empty string, max 200_000 chars |
| `extractedSkills` | array | yes | Array of `{ skill: string }` |
| `inferredSkills` | array | yes | Array of `{ skill: string, source: string }` |
| `role` | string | no | Optional override (see Supported Combinations) |
| `level` | string | no | Optional override (see Supported Combinations) |
| `companyType` | string | no | Optional override (see Supported Combinations) |
| `experienceYears` | number | no | Optional override; clamped to `0..50` |

Overrides and supported combinations:

- `role`, `level`, and `companyType` overrides are allowed only if they match a supported combination.
- If not provided, defaults use the first supported combination (currently `react/junior/unicorn`).

Supported combinations (current):

- `{"role":"react","level":"junior","companyType":"unicorn"}`
- `{"role":"react","level":"senior","companyType":"unicorn"}`

Success response `200` (exact top-level keys only):

```json
{
  "metadata": {
    "role": "react",
    "level": "junior",
    "companyType": "unicorn",
    "experienceYears": 0
  },
  "matches": {
    "matchedSkills": [
      { "skill": "React", "category": "Frontend", "type": "explicit" }
    ],
    "weakSignals": [
      { "skill": "Hooks", "category": "Frontend", "type": "weak-signal" }
    ],
    "missingSkills": [{ "skill": "Testing", "category": "Quality" }]
  },
  "analysis": {
    "finalScore": 75.5,
    "categoryScores": [
      {
        "category": "Frontend",
        "score": 0.72,
        "possible": 1.0,
        "percentage": 0.72,
        "skills": [
          {
            "skillName": "React",
            "matchType": "explicit",
            "score": 0.2,
            "possible": 0.2
          }
        ]
      }
    ],
    "insights": [
      {
        "category": "Frontend",
        "score": 0.72,
        "possible": 1.0,
        "percentage": 0.72,
        "level": "Strong"
      }
    ],
    "strengthWeakness": {
      "strengths": [
        { "category": "Frontend", "skill": "React", "type": "explicit" }
      ],
      "weaknesses": [
        { "category": "Frontend", "skill": "Hooks", "type": "weak" }
      ],
      "criticalGaps": [
        { "category": "Quality", "skill": "Testing", "type": "missing" }
      ]
    },
    "atsReadiness": {
      "score": 10,
      "total": 20,
      "percentage": 0.5,
      "matchedKeywords": ["react"],
      "missingKeywords": ["testing"]
    },
    "recommendations": [
      "Improve your foundation in **Frontend**. Your skill coverage is currently at 72.0%."
    ]
  }
}
```

Field constraints (selected):

- `metadata.role`, `metadata.level`, `metadata.companyType`: strings
- `metadata.experienceYears`: number (0..50)
- `matches.matchedSkills[]`: `{ skill: string, category: string, type: "explicit" }`
- `matches.weakSignals[]`: `{ skill: string, category: string, type: "weak-signal" }`
- `matches.missingSkills[]`: `{ skill: string, category: string }`
- `analysis.finalScore`: number in range 0..100
- `analysis.categoryScores[]`: `{ category, score, possible, percentage, skills[] }`
- `analysis.categoryScores[].skills[]`: `{ skillName, matchType, score, possible }`
- `analysis.insights[]`: `{ category, score, possible, percentage, level }`
- `analysis.strengthWeakness`: `{ strengths[], weaknesses[], criticalGaps[] }`
- `analysis.atsReadiness`: `{ score, total, percentage, matchedKeywords[], missingKeywords[] }`
- `analysis.recommendations`: array of strings

- Additional constraints (enforced by server):
  - Both `extractedSkills` and `inferredSkills` keys are required in the request JSON for `/api/analyze-resume` (they may be empty arrays). If either key is missing the server returns `400 VALIDATION_ERROR`.
  - Size limits: `extractedSkills` and `inferredSkills` arrays are limited to **1000** items each, and individual skill/source strings are limited to **500** characters. Violations result in `400 BAD_REQUEST` with details.

Error responses:
| Status | error.code | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Missing/invalid `resumeText`, invalid `role`/`level`/`companyType`, or unsupported benchmark selection |
| 400 | `BAD_REQUEST` | Invalid `extractedSkills` or `inferredSkills` array shape |
| 405 | `METHOD_NOT_ALLOWED` | Any method other than POST (also sets `Allow: POST`) |
| 413 | `PAYLOAD_TOO_LARGE` | `resumeText` length > 200_000 (details include `maxChars`, `receivedChars`) |
| 500 | `INTERNAL_ERROR` | Internal analysis failure |
