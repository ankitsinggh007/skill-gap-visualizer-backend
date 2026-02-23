#!/usr/bin/env node
import assert from "node:assert/strict";

// Force deterministic extraction (no OpenAI) for these tests
process.env.ENABLE_OPENAI_EXTRACTION = "false";

const { default: extractHandler } = await import("../api/extract.js");
const { default: analyzeHandler } = await import("../api/analyze-resume.js");
const { MockReq, MockRes } = await import("./_mocks.js");

let testsRun = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsRun++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  ${err.message}`);
    testsFailed++;
  }
}

async function callExtract(body) {
  const req = new MockReq("POST", body);
  const res = new MockRes();
  await extractHandler(req, res);
  return res;
}

async function callAnalyze(body) {
  const req = new MockReq("POST", body);
  const res = new MockRes();
  await analyzeHandler(req, res);
  return res;
}

function sortSkills(list) {
  return (list || [])
    .map((s) => s.skill)
    .sort((a, b) => a.localeCompare(b));
}

function hasSkill(list, skillName) {
  return Array.isArray(list) && list.some((s) => s.skill === skillName);
}

function assertErrorSchema(res, code) {
  assert(res.jsonData?.error, "Expected error object");
  assert.strictEqual(res.jsonData.error.code, code, "Error code mismatch");
  assert.strictEqual(
    typeof res.jsonData.error.message,
    "string",
    "Error message must be string",
  );
}

console.log("\nENDPOINTS: FULL INTEGRATION TESTS\n");

// ------------------------------------------------------------------
// /api/extract
// ------------------------------------------------------------------
await test("extract: deterministic fallback output w/ known keywords", async () => {
  const res = await callExtract({
    resumeText:
      "Frontend developer with React, JavaScript and API integrations. Education: B.Tech CSE.",
  });

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.jsonData.extractionSource, "fallback");

  // extractedSkills should include javascript, react, api
  const extracted = sortSkills(res.jsonData.extractedSkills);
  assert.deepEqual(extracted, ["api", "javascript", "react"]);

  // inferredSkills should include specific mapped labels
  const inferred = res.jsonData.inferredSkills.map((s) => s.skill);
  assert(inferred.includes("Programming Language"));
  assert(inferred.includes("Frontend Framework"));
  assert(inferred.includes("API Integration"));

  // education + summary from fallback heuristics
  assert.strictEqual(res.jsonData.educationLevel, "Bachelor's");
  assert.strictEqual(
    res.jsonData.rawSummary,
    "Candidate with developer-related experience.",
  );
});

await test("extract: missing resumeText -> 400 VALIDATION_ERROR", async () => {
  const res = await callExtract({});
  assert.strictEqual(res.statusCode, 400);
  assertErrorSchema(res, "VALIDATION_ERROR");
});

await test("extract: payload too large -> 413", async () => {
  const res = await callExtract({ resumeText: "x".repeat(30_001) });
  assert.strictEqual(res.statusCode, 413);
  assertErrorSchema(res, "PAYLOAD_TOO_LARGE");
});

await test("extract: determinism (same input, same output)", async () => {
  const body = {
    resumeText: "React JavaScript API integrations developer.",
  };
  const res1 = await callExtract(body);
  const res2 = await callExtract(body);
  assert.strictEqual(res1.statusCode, 200);
  assert.strictEqual(res2.statusCode, 200);
  assert.deepEqual(res1.jsonData, res2.jsonData);
});

// ------------------------------------------------------------------
// /api/analyze-resume
// ------------------------------------------------------------------
await test("analyze: explicit skill matches benchmark", async () => {
  const res = await callAnalyze({
    resumeText: "React hooks",
    extractedSkills: [{ skill: "Hooks" }],
    inferredSkills: [],
  });

  assert.strictEqual(res.statusCode, 200);
  assert(hasSkill(res.jsonData.matches.matchedSkills, "Hooks"));
});

await test("analyze: missing extractedSkills -> 400 VALIDATION_ERROR", async () => {
  const res = await callAnalyze({
    resumeText: "React",
    inferredSkills: [],
  });
  assert.strictEqual(res.statusCode, 400);
  assertErrorSchema(res, "VALIDATION_ERROR");
});

await test("analyze: inferredSkills missing source -> 400 BAD_REQUEST", async () => {
  const res = await callAnalyze({
    resumeText: "React",
    extractedSkills: [],
    inferredSkills: [{ skill: "Frontend Framework" }],
  });
  assert.strictEqual(res.statusCode, 400);
  assertErrorSchema(res, "BAD_REQUEST");
});

await test("analyze: unsupported role -> 400 VALIDATION_ERROR", async () => {
  const res = await callAnalyze({
    resumeText: "React",
    extractedSkills: [],
    inferredSkills: [],
    role: "unknown-role",
  });
  assert.strictEqual(res.statusCode, 400);
  assertErrorSchema(res, "VALIDATION_ERROR");
});

await test("analyze: payload too large -> 413", async () => {
  const res = await callAnalyze({
    resumeText: "x".repeat(100_001),
    extractedSkills: [],
    inferredSkills: [],
  });
  assert.strictEqual(res.statusCode, 413);
  assertErrorSchema(res, "PAYLOAD_TOO_LARGE");
});

await test("analyze: determinism (same input, same output)", async () => {
  const body = {
    resumeText: "React hooks useEffect fetch promise git collaborated",
    extractedSkills: [{ skill: "Git & Branching" }],
    inferredSkills: [],
  };
  const res1 = await callAnalyze(body);
  const res2 = await callAnalyze(body);
  assert.strictEqual(res1.statusCode, 200);
  assert.strictEqual(res2.statusCode, 200);
  assert.deepEqual(res1.jsonData, res2.jsonData);
});

console.log(`\nResults: ${testsRun - testsFailed} passed, ${testsFailed} failed`);
process.exit(testsFailed > 0 ? 1 : 0);
