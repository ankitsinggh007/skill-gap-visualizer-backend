#!/usr/bin/env node
import assert from "node:assert/strict";

// This test requires real OpenAI calls.
if (process.env.ENABLE_OPENAI_EXTRACTION !== "true" || !process.env.OPENAI_API_KEY) {
  console.log("SKIP: OpenAI extraction not enabled. Set ENABLE_OPENAI_EXTRACTION=true and OPENAI_API_KEY.");
  process.exit(0);
}

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

async function callExtract(resumeText) {
  const req = new MockReq("POST", { resumeText });
  const res = new MockRes();
  await extractHandler(req, res);
  return res;
}

async function callAnalyze(resumeText, extractedSkills, inferredSkills) {
  const req = new MockReq("POST", {
    resumeText,
    extractedSkills,
    inferredSkills,
  });
  const res = new MockRes();
  await analyzeHandler(req, res);
  return res;
}

function assertAnalyzeOk(res) {
  assert.strictEqual(res.statusCode, 200, "Expected 200 from analyze");
  assert(res.jsonData?.analysis, "Missing analysis");
  assert(res.jsonData?.matches, "Missing matches");
  assert(
    typeof res.jsonData.analysis.finalScore === "number",
    "finalScore must be number",
  );
  assert(
    res.jsonData.analysis.finalScore >= 0 &&
      res.jsonData.analysis.finalScore <= 100,
    "finalScore out of range",
  );
}

console.log("\nOPENAI E2E: Extract → Analyze\n");

const scenarios = [
  {
    name: "Frontend resume (React-focused)",
    resumeText: `
    Frontend Engineer with React, JSX, Hooks, Redux, React Router.
    Built UI dashboards and integrated REST APIs. Used Git.
    `,
  },
  {
    name: "JavaScript fundamentals",
    resumeText: `
    Worked with JavaScript, closures, async/await, event loop, promises.
    `,
  },
  {
    name: "Minimal resume",
    resumeText: `
    Fresher seeking frontend opportunities.
    `,
  },
];

for (const scenario of scenarios) {
  await test(`${scenario.name}: extract then analyze`, async () => {
    const extractRes = await callExtract(scenario.resumeText);
    assert.strictEqual(extractRes.statusCode, 200, "Expected 200 from extract");
    assert.strictEqual(
      extractRes.jsonData.extractionSource,
      "openai",
      "Expected extractionSource=openai",
    );

    const analyzeRes = await callAnalyze(
      scenario.resumeText,
      extractRes.jsonData.extractedSkills,
      extractRes.jsonData.inferredSkills,
    );

    assertAnalyzeOk(analyzeRes);

    // Basic signal check: some skill evidence should be present for non-empty resumes
    const matchCount =
      analyzeRes.jsonData.matches.matchedSkills.length +
      analyzeRes.jsonData.matches.weakSignals.length;
    if (scenario.name !== "Minimal resume") {
      assert(
        matchCount > 0,
        "Expected at least one matched or weak signal skill",
      );
    }
  });
}

console.log(`\nResults: ${testsRun - testsFailed} passed, ${testsFailed} failed`);
process.exit(testsFailed > 0 ? 1 : 0);
