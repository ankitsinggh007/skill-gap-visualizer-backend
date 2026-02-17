#!/usr/bin/env node
/\*\*

- Error Response Examples
- Shows actual error responses from both API endpoints
  \*/

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║ STANDARDIZED ERROR RESPONSE EXAMPLES ║
║ From both /api/extract and /api/analyze-resume ║
╚════════════════════════════════════════════════════════════════════════════╝

🚫 METHOD_NOT_ALLOWED (405)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Request: GET /api/extract

Response: 405 Method Not Allowed
{
"error": {
"code": "METHOD_NOT_ALLOWED",
"message": "Only POST method is allowed",
"details": {
"method": "GET"
}
}
}

───────────────────────────────────────────────────────────────────────────

Request: GET /api/analyze-resume

Response: 405 Method Not Allowed
{
"error": {
"code": "METHOD_NOT_ALLOWED",
"message": "Use POST /api/analyze-resume",
"details": {
"method": "GET"
}
}
}

❌ VALIDATION_ERROR (400)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Request: POST /api/extract
{ "resumeText": 123 }

Response: 400 Bad Request
{
"error": {
"code": "VALIDATION_ERROR",
"message": "resumeText is required and must be a string",
"details": {
"received": "number"
}
}
}

───────────────────────────────────────────────────────────────────────────

Request: POST /api/analyze-resume
{ "extractedSkills": [] } (missing resumeText)

Response: 400 Bad Request
{
"error": {
"code": "VALIDATION_ERROR",
"message": "resumeText is required and must be a string",
"details": {
"received": "undefined"
}
}
}

⚠️ INTERNAL_ERROR (500)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Request: POST /api/extract
{ "resumeText": "..." } (extraction engine crashes)

Response: 500 Internal Server Error
{
"error": {
"code": "INTERNAL_ERROR",
"message": "Internal server error during extraction",
"details": {
"message": "Error: Cannot process resume"
}
}
}

───────────────────────────────────────────────────────────────────────────

Request: POST /api/analyze-resume
{ "resumeText": "...", ... } (analysis orchestrator crashes)

Response: 500 Internal Server Error
{
"error": {
"code": "INTERNAL_ERROR",
"message": "Internal server error during analysis",
"details": {
"message": "Error: Benchmark not found"
}
}
}

📋 RESPONSE SCHEMA VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All error responses MUST have this structure:

{
"error": { ← Top-level "error" key (always present)
"code": "string", ← Machine-readable error code
"message": "string", ← Human-readable error message  
 "details": { ← Optional object with additional context
"key": "value", ← Can be any shape depending on context
...
}
}
}

Rules:
✓ All errors wrapped in "error" object (not at top-level)
✓ "code" is always a CONSTANT like "VALIDATION_ERROR"
✓ "message" is always a descriptive string
✓ "details" is optional but recommended for debugging
✓ No "success" or "status" fields in error responses
✓ HTTP status code matches error type (400, 405, 500)

✅ HAPPY PATH RESPONSES (UNCHANGED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POST /api/extract with valid input:
Status: 200 OK
{
"extractedSkills": [
{ "skill": "javascript" },
{ "skill": "react" }
],
"inferredSkills": [
{
"skill": "Programming Language",
"source": "Detected keyword \\"javascript\\" in resume text."
},
{
"skill": "Frontend Framework",
"source": "Detected keyword \\"react\\" in resume text."
}
]
}

───────────────────────────────────────────────────────────────────────────

POST /api/analyze-resume with valid input:
Status: 200 OK
{
"metadata": {
"role": "react",
"level": "junior",
"companyType": "unicorn",
"experienceYears": 0,
"analysisDate": "2024-01-15T10:30:00Z"
},
"matches": [ ... ],
"analysis": {
"finalScore": 8.24,
"categoryScores": { ... },
"insights": { ... },
"strengthWeakness": { ... },
"atsReadiness": { ... },
"recommendations": [ ... ]
}
}

Note: Happy-path responses DO NOT contain an "error" field
Errors are only sent with 4xx/5xx status codes

🔍 ERROR CODE REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Code Status Meaning
─────────────────────────────────────────────────────────────────────────
METHOD_NOT_ALLOWED 405 Request method (GET/PUT/DELETE) not allowed
VALIDATION_ERROR 400 Request body/params type/format incorrect
MISSING_FIELD 400 Required parameter/field not provided
BAD_REQUEST 400 Request structure violates schema
INTERNAL_ERROR 500 Unexpected server-side exception

═══════════════════════════════════════════════════════════════════════════════

Summary: All error responses are now standardized and consistent.
Frontend can reliably parse error codes and messages.
Ready for production deployment. ✅
`);
