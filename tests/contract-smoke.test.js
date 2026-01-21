#!/usr/bin/env node
/**
 * BE-P2-001: Contract Smoke Tests
 * Regression protection for API response contracts
 *
 * Run: node tests/contract-smoke.test.js
 * Or:  npm run test:contract
 */

import assert from "node:assert/strict";
import extractHandler from "../api/extract.js";
import analyzeHandler from "../api/analyze-resume.js";
import { MockReq, MockRes } from "./_mocks.js";

let testsRun = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsRun++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗",
  );
  console.log("║         BE-P2-001: Contract Smoke Tests                    ║");
  console.log("║         Regression protection for API contracts            ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  // ====================================================================
  // /api/extract Tests
  // ====================================================================
  console.log("📋 /api/extract Contract Tests\n");

  // Test: 200 success with valid input
  test("200: Valid resumeText returns success", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript React Node.js" });
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(res.statusCode, 200, "Status should be 200");
    assert(res.jsonData, "Should return JSON data");
    assert(res.headersSent, "Should send response");
  });

  // Test: 200 response contract shape
  test("200: Response has only extractedSkills and inferredSkills", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript" });
    const res = new MockRes();
    await extractHandler(req, res);

    const keys = Object.keys(res.jsonData);
    assert.deepEqual(
      keys.sort(),
      ["extractedSkills", "inferredSkills"].sort(),
      "Top-level keys should match exactly",
    );
  });

  // Test: extractedSkills is array
  test("200: extractedSkills is an array", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript" });
    const res = new MockRes();
    await extractHandler(req, res);

    assert(
      Array.isArray(res.jsonData.extractedSkills),
      "extractedSkills must be array",
    );
  });

  // Test: inferredSkills is array
  test("200: inferredSkills is an array", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript" });
    const res = new MockRes();
    await extractHandler(req, res);

    assert(
      Array.isArray(res.jsonData.inferredSkills),
      "inferredSkills must be array",
    );
  });

  // Test: extractedSkills item shape
  test("200: extractedSkills items have { skill: string }", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript React" });
    const res = new MockRes();
    await extractHandler(req, res);

    if (res.jsonData.extractedSkills.length > 0) {
      const item = res.jsonData.extractedSkills[0];
      assert("skill" in item, "Should have skill property");
      assert.strictEqual(typeof item.skill, "string", "skill must be string");
      const itemKeys = Object.keys(item);
      assert.deepEqual(
        itemKeys,
        ["skill"],
        "extractedSkills item should only have skill",
      );
    }
  });

  // Test: inferredSkills item shape
  test("200: inferredSkills items have { skill: string, source: string }", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript React" });
    const res = new MockRes();
    await extractHandler(req, res);

    if (res.jsonData.inferredSkills.length > 0) {
      const item = res.jsonData.inferredSkills[0];
      assert("skill" in item, "Should have skill property");
      assert("source" in item, "Should have source property");
      assert.strictEqual(typeof item.skill, "string", "skill must be string");
      assert.strictEqual(typeof item.source, "string", "source must be string");
      const itemKeys = Object.keys(item).sort();
      assert.deepEqual(
        itemKeys,
        ["skill", "source"].sort(),
        "Should have exactly skill and source",
      );
    }
  });

  // Test: 400 missing resumeText
  test("400: Missing resumeText", async () => {
    const req = new MockReq("POST", {});
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(res.statusCode, 400, "Status should be 400");
    assert.strictEqual(
      res.jsonData.error.code,
      "VALIDATION_ERROR",
      "Should be VALIDATION_ERROR",
    );
  });

  // Test: 400 invalid resumeText type
  test("400: Invalid resumeText type", async () => {
    const req = new MockReq("POST", { resumeText: 123 });
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(res.statusCode, 400, "Status should be 400");
    assert.strictEqual(res.jsonData.error.code, "VALIDATION_ERROR");
  });

  // Test: 400 error schema
  test("400: Error response has { error: { code, message, details } }", async () => {
    const req = new MockReq("POST", {});
    const res = new MockRes();
    await extractHandler(req, res);

    assert(res.jsonData.error, "Should have error object");
    assert.strictEqual(
      typeof res.jsonData.error.code,
      "string",
      "code must be string",
    );
    assert.strictEqual(
      typeof res.jsonData.error.message,
      "string",
      "message must be string",
    );
    assert(
      typeof res.jsonData.error.details === "object",
      "details must be object",
    );
    const errorKeys = Object.keys(res.jsonData).sort();
    assert.deepEqual(
      errorKeys,
      ["error"],
      "Error response should only have error key",
    );
  });

  // Test: 405 method not allowed
  test("405: GET request rejected", async () => {
    const req = new MockReq("GET", {});
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(res.statusCode, 405, "Status should be 405");
    assert.strictEqual(res.jsonData.error.code, "METHOD_NOT_ALLOWED");
  });

  // Test: 405 Allow header
  test("405: Allow header present", async () => {
    const req = new MockReq("GET", {});
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(
      res.getHeader("Allow"),
      "POST",
      "Allow header should be POST",
    );
  });

  // Test: 413 payload too large
  test("413: Payload too large rejected", async () => {
    const largeText = "x".repeat(100_001);
    const req = new MockReq("POST", { resumeText: largeText });
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(res.statusCode, 413, "Status should be 413");
    assert.strictEqual(res.jsonData.error.code, "PAYLOAD_TOO_LARGE");
    assert(res.jsonData.error.details.maxChars, "Should include maxChars");
    assert(
      res.jsonData.error.details.receivedChars,
      "Should include receivedChars",
    );
  });

  // ====================================================================
  // /api/analyze-resume Tests
  // ====================================================================
  console.log("\n📋 /api/analyze-resume Contract Tests\n");

  // Test: 200 success
  test("200: Valid input returns success", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React Node.js",
      extractedSkills: [],
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 200, "Status should be 200");
    assert(res.jsonData, "Should return JSON data");
  });

  // Test: 200 response top-level contract
  test("200: Response top-level keys are exactly metadata, matches, analysis", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React",
      extractedSkills: [],
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    const topKeys = Object.keys(res.jsonData).sort();
    const expectedKeys = ["metadata", "matches", "analysis"].sort();
    assert.deepEqual(
      topKeys,
      expectedKeys,
      "Top-level keys must match exactly",
    );
  });

  // Test: metadata is hardcoded
  test("200: Metadata has hardcoded role/level/companyType/experienceYears", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React",
      extractedSkills: [],
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    const meta = res.jsonData.metadata;
    assert.strictEqual(meta.role, "react", "role must be 'react'");
    assert.strictEqual(meta.level, "junior", "level must be 'junior'");
    assert.strictEqual(
      meta.companyType,
      "unicorn",
      "companyType must be 'unicorn'",
    );
    assert.strictEqual(meta.experienceYears, 0, "experienceYears must be 0");
  });

  // Test: analysis.finalScore is number 0-100
  test("200: analysis.finalScore is number in range 0-100", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React",
      extractedSkills: [],
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    const finalScore = res.jsonData.analysis.finalScore;
    assert.strictEqual(
      typeof finalScore,
      "number",
      "finalScore must be number",
    );
    assert(finalScore >= 0 && finalScore <= 100, "finalScore must be 0-100");
  });

  // Test: analysis has exactly required keys
  test("200: analysis has exactly { finalScore, categoryScores, insights, strengthWeakness, atsReadiness, recommendations }", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React",
      extractedSkills: [],
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    const analysisKeys = Object.keys(res.jsonData.analysis).sort();
    const expectedKeys = [
      "finalScore",
      "categoryScores",
      "insights",
      "strengthWeakness",
      "atsReadiness",
      "recommendations",
    ].sort();
    assert.deepEqual(
      analysisKeys,
      expectedKeys,
      "analysis keys must match exactly",
    );
  });

  // Test: 400 invalid skill arrays
  test("400: Invalid skill array rejected", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React",
      extractedSkills: [{ skill: "JS" }],
      inferredSkills: [{ skill: "Frontend" }], // missing source
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 400, "Status should be 400");
    assert.strictEqual(res.jsonData.error.code, "BAD_REQUEST");
  });

  // Test: 400 extractedSkills not array
  test("400: extractedSkills not array rejected", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript",
      extractedSkills: "not-an-array",
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 400, "Status should be 400");
    assert.strictEqual(res.jsonData.error.code, "BAD_REQUEST");
  });

  // Test: 400 error schema
  test("400: Error has standardized schema { error: { code, message, details } }", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript",
      extractedSkills: "not-array",
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert(res.jsonData.error, "Should have error object");
    assert.strictEqual(typeof res.jsonData.error.code, "string");
    assert.strictEqual(typeof res.jsonData.error.message, "string");
    assert(typeof res.jsonData.error.details === "object");
  });

  // Test: 405 method not allowed
  test("405: GET request rejected", async () => {
    const req = new MockReq("GET", {});
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 405, "Status should be 405");
    assert.strictEqual(res.jsonData.error.code, "METHOD_NOT_ALLOWED");
  });

  // Test: 405 Allow header
  test("405: Allow header present", async () => {
    const req = new MockReq("GET", {});
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(
      res.getHeader("Allow"),
      "POST",
      "Allow header should be POST",
    );
  });

  // Test: 413 payload too large
  test("413: Payload too large rejected", async () => {
    const largeText = "x".repeat(100_001);
    const req = new MockReq("POST", {
      resumeText: largeText,
      extractedSkills: [],
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 413, "Status should be 413");
    assert.strictEqual(res.jsonData.error.code, "PAYLOAD_TOO_LARGE");
  });

  // ====================================================================
  // Summary
  // ====================================================================
  console.log(`\n📊 Results: ${testsRun} tests, ${testsFailed} failed\n`);

  if (testsFailed === 0) {
    console.log("✅ All contract smoke tests passed!");
    console.log("   Regression protection verified.\n");
    process.exit(0);
  } else {
    console.log("❌ Some tests failed\n");
    process.exit(1);
  }
}

// Run tests
runTests().catch((err) => {
  console.error("Test suite error:", err);
  process.exit(1);
});
