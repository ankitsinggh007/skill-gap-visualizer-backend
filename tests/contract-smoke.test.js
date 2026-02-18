import assert from "node:assert/strict";
import extractHandler from "../api/extract.js";
import analyzeHandler from "../api/analyze-resume.js";
import { MockReq, MockRes } from "./_mocks.js";

let testsRun = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    await fn();
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
  await test("200: Valid resumeText returns success", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript React Node.js" });
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(res.statusCode, 200, "Status should be 200");
    assert(res.jsonData, "Should return JSON data");
    assert(res.headersSent, "Should send response");
  });

  // Test: 200 response contract shape
  await test("200: Response has full extraction fields", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript" });
    const res = new MockRes();
    await extractHandler(req, res);

    const keys = Object.keys(res.jsonData);
    const expectedKeys = [
      "extractedSkills",
      "inferredSkills",
      "experienceYears",
      "educationLevel",
      "tools",
      "projects",
      "rawSummary",
    ];
    assert.deepEqual(
      keys.sort(),
      expectedKeys.sort(),
      "Top-level keys should match exactly",
    );
  });

  // Test: extractedSkills is array
  await test("200: extractedSkills is an array", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript" });
    const res = new MockRes();
    await extractHandler(req, res);

    assert(
      Array.isArray(res.jsonData.extractedSkills),
      "extractedSkills must be array",
    );
  });

  // Test: inferredSkills is array
  await test("200: inferredSkills is an array", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript" });
    const res = new MockRes();
    await extractHandler(req, res);

    assert(
      Array.isArray(res.jsonData.inferredSkills),
      "inferredSkills must be array",
    );
  });

  // Test: extractedSkills item shape + sanity (trimmed, lowercase, non-empty)
  await test("200: extractedSkills items have { skill: string }", async () => {
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

      // Sanity check: skills must be trimmed, lowercase, non-empty
      for (const skill of res.jsonData.extractedSkills) {
        assert(skill.skill.trim().length > 0, "skill must be non-empty");
        assert.strictEqual(
          skill.skill,
          skill.skill.trim(),
          "skill must be trimmed",
        );
        assert.strictEqual(
          skill.skill,
          skill.skill.toLowerCase(),
          "skill must be lowercase",
        );
      }
    }
  });

  // Test: inferredSkills item shape + sanity (trimmed, non-empty, casing preserved)
  await test("200: inferredSkills items have { skill: string, source: string }", async () => {
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

      // Sanity check: inferred skills/sources must be trimmed and non-empty (casing preserved)
      for (const item of res.jsonData.inferredSkills) {
        assert(
          item.skill.trim().length > 0,
          "inferred skill must be non-empty",
        );
        assert(item.source.trim().length > 0, "source must be non-empty");
        assert.strictEqual(
          item.skill,
          item.skill.trim(),
          "inferred skill must be trimmed",
        );
        assert.strictEqual(
          item.source,
          item.source.trim(),
          "source must be trimmed",
        );
      }
    }
  });

  // Test: experienceYears is number or null
  await test("200: experienceYears is number or null", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript React" });
    const res = new MockRes();
    await extractHandler(req, res);

    const v = res.jsonData.experienceYears;
    assert(
      v === null || typeof v === "number",
      "experienceYears must be number or null",
    );
  });

  // Test: educationLevel is string
  await test("200: educationLevel is string", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript React" });
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(
      typeof res.jsonData.educationLevel,
      "string",
      "educationLevel must be string",
    );
  });

  // Test: tools/projects are arrays
  await test("200: tools/projects are arrays", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript React" });
    const res = new MockRes();
    await extractHandler(req, res);

    assert(Array.isArray(res.jsonData.tools), "tools must be array");
    assert(Array.isArray(res.jsonData.projects), "projects must be array");
  });

  // Test: rawSummary is string
  await test("200: rawSummary is string", async () => {
    const req = new MockReq("POST", { resumeText: "JavaScript React" });
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(
      typeof res.jsonData.rawSummary,
      "string",
      "rawSummary must be string",
    );
  });

  // Test: 400 missing resumeText
  await test("400: Missing resumeText", async () => {
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
  await test("400: Invalid resumeText type", async () => {
    const req = new MockReq("POST", { resumeText: 123 });
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(res.statusCode, 400, "Status should be 400");
    assert.strictEqual(res.jsonData.error.code, "VALIDATION_ERROR");
  });

  // Test: 400 error schema
  await test("400: Error response has { error: { code, message, details } }", async () => {
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
  await test("405: GET request rejected", async () => {
    const req = new MockReq("GET", {});
    const res = new MockRes();
    await extractHandler(req, res);

    assert.strictEqual(res.statusCode, 405, "Status should be 405");
    assert.strictEqual(res.jsonData.error.code, "METHOD_NOT_ALLOWED");
  });

  // Test: 405 Allow header
  await test("405: Allow header present", async () => {
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
  await test("413: Payload too large rejected", async () => {
    const largeText = "x".repeat(200_001);
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
  await test("200: Valid input returns success", async () => {
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
  await test("200: Response top-level keys are exactly metadata, matches, analysis", async () => {
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

  // Test: matches structure + matchedSkills array
  await test("200: matches has matchedSkills array", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React",
      extractedSkills: [],
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert(
      res.jsonData.matches && typeof res.jsonData.matches === "object",
      "matches must be object",
    );
    assert(
      Array.isArray(res.jsonData.matches.matchedSkills),
      "matchedSkills must be array",
    );
    if ("missingSkills" in res.jsonData.matches) {
      assert(
        Array.isArray(res.jsonData.matches.missingSkills),
        "missingSkills must be array",
      );
    }
  });

  // Test: metadata defaults are stable when not provided
  await test("200: Metadata defaults to react/junior/unicorn/0", async () => {
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

  // Test: supported benchmark selection is accepted
  await test("200: Supported role/level/companyType accepted", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React",
      extractedSkills: [],
      inferredSkills: [],
      role: "react",
      level: "senior",
      companyType: "unicorn",
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 200, "Status should be 200");
    assert.strictEqual(res.jsonData.metadata.role, "react");
    assert.strictEqual(res.jsonData.metadata.level, "senior");
    assert.strictEqual(res.jsonData.metadata.companyType, "unicorn");
  });

  // Test: unsupported benchmark selection rejected deterministically
  await test("400: Unsupported role/level/companyType rejected", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React",
      extractedSkills: [],
      inferredSkills: [],
      role: "backend",
      level: "junior",
      companyType: "unicorn",
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 400, "Status should be 400");
    assert.strictEqual(res.jsonData.error.code, "VALIDATION_ERROR");
    assert(
      Array.isArray(res.jsonData.error.details.supportedCombinations),
      "Should include supportedCombinations",
    );
  });

  // Test: analysis.finalScore is number 0-100
  await test("200: analysis.finalScore is number in range 0-100", async () => {
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
  await test("200: analysis has exactly { finalScore, categoryScores, insights, strengthWeakness, atsReadiness, recommendations }", async () => {
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

  // Test: categoryScores structure and values (sane: category string, score 0-100 number)
  await test("200: categoryScores items have sane structure", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React",
      extractedSkills: [],
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    const { categoryScores } = res.jsonData.analysis;
    assert(Array.isArray(categoryScores), "categoryScores must be array");
    for (const c of categoryScores) {
      assert(typeof c === "object" && c, "categoryScores item must be object");
      assert(
        typeof c.category === "string" && c.category.trim(),
        "category must be non-empty string",
      );
      assert(typeof c.score === "number", "score must be number");
      assert(c.score >= 0 && c.score <= 100, "score must be 0-100");
    }
  });

  // Test: strengthWeakness and atsReadiness structure
  await test("200: strengthWeakness + atsReadiness structure sane", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript React",
      extractedSkills: [],
      inferredSkills: [],
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    const { strengthWeakness, atsReadiness } = res.jsonData.analysis;

    assert(
      strengthWeakness && typeof strengthWeakness === "object",
      "strengthWeakness must be object",
    );
    for (const key of ["strengths", "weaknesses", "criticalGaps"]) {
      assert(
        Array.isArray(strengthWeakness[key]),
        `strengthWeakness.${key} must be array`,
      );
    }

    assert(
      atsReadiness && typeof atsReadiness === "object",
      "atsReadiness must be object",
    );
    for (const key of [
      "score",
      "total",
      "percentage",
      "matchedKeywords",
      "missingKeywords",
    ]) {
      assert(key in atsReadiness, `atsReadiness.${key} missing`);
    }
    assert(
      typeof atsReadiness.percentage === "number",
      "atsReadiness.percentage must be number",
    );
  });

  // Test: 400 invalid skill arrays
  await test("400: Invalid skill array rejected", async () => {
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

  // Test: 400 extractedSkills missing key
  await test("400: extractedSkills missing key rejected", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript",
      inferredSkills: [],
      // extractedSkills key deliberately omitted
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 400, "Status should be 400");
    assert.strictEqual(res.jsonData.error.code, "VALIDATION_ERROR");
    assert(
      res.jsonData.error.message.includes("required"),
      "Should mention required",
    );
  });

  // Test: 400 inferredSkills missing key
  await test("400: inferredSkills missing key rejected", async () => {
    const req = new MockReq("POST", {
      resumeText: "JavaScript",
      extractedSkills: [],
      // inferredSkills key deliberately omitted
    });
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 400, "Status should be 400");
    assert.strictEqual(res.jsonData.error.code, "VALIDATION_ERROR");
    assert(
      res.jsonData.error.message.includes("required"),
      "Should mention required",
    );
  });

  // Test: 400 extractedSkills not array
  await test("400: extractedSkills not array rejected", async () => {
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
  await test("400: Error has standardized schema { error: { code, message, details } }", async () => {
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
  await test("405: GET request rejected", async () => {
    const req = new MockReq("GET", {});
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 405, "Status should be 405");
    assert.strictEqual(res.jsonData.error.code, "METHOD_NOT_ALLOWED");
  });

  // Test: 405 Allow header
  await test("405: Allow header present", async () => {
    const req = new MockReq("GET", {});
    const res = new MockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(
      res.getHeader("Allow"),
      "POST",
      "Allow header should be POST",
    );
  });

  // Test: 413 payload too large (derive limit from MAX_RESUME_CHARS)
  // Note: MAX_RESUME_CHARS is 200_000, so we test with 200_001
  await test("413: Payload too large rejected", async () => {
    const largeText = "x".repeat(200_001);
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
  // Determinism Tests (BE-P2-002: repeat 3x = identical output)
  // ====================================================================
  console.log("\n🔄 Determinism Tests (3x repeat)\n");

  // Helper to deep compare objects (exclude timestamps)
  function deepCompareSkillResponses(resp1, resp2) {
    return (
      JSON.stringify(
        resp1.extractedSkills.sort((a, b) => a.skill.localeCompare(b.skill)),
      ) ===
        JSON.stringify(
          resp2.extractedSkills.sort((a, b) => a.skill.localeCompare(b.skill)),
        ) &&
      JSON.stringify(
        resp1.inferredSkills.sort((a, b) => a.skill.localeCompare(b.skill)),
      ) ===
        JSON.stringify(
          resp2.inferredSkills.sort((a, b) => a.skill.localeCompare(b.skill)),
        )
    );
  }

  // Helper for analyze-resume comparison
  function deepCompareAnalyzeResponses(resp1, resp2) {
    return (
      resp1.metadata.role === resp2.metadata.role &&
      resp1.metadata.level === resp2.metadata.level &&
      resp1.metadata.companyType === resp2.metadata.companyType &&
      resp1.analysis.finalScore === resp2.analysis.finalScore &&
      JSON.stringify(
        resp1.analysis.categoryScores.sort((a, b) =>
          a.category.localeCompare(b.category),
        ),
      ) ===
        JSON.stringify(
          resp2.analysis.categoryScores.sort((a, b) =>
            a.category.localeCompare(b.category),
          ),
        )
    );
  }

  // Test: /api/extract determinism
  await test("DETERMINISM: /api/extract returns identical output on 3 calls", async () => {
    const testPayload = { resumeText: "JavaScript React Node.js TypeScript" };

    const res1 = new MockRes();
    const res2 = new MockRes();
    const res3 = new MockRes();

    const req1 = new MockReq("POST", testPayload);
    const req2 = new MockReq("POST", testPayload);
    const req3 = new MockReq("POST", testPayload);

    await extractHandler(req1, res1);
    await extractHandler(req2, res2);
    await extractHandler(req3, res3);

    assert.strictEqual(res1.statusCode, 200, "Call 1: Status 200");
    assert.strictEqual(res2.statusCode, 200, "Call 2: Status 200");
    assert.strictEqual(res3.statusCode, 200, "Call 3: Status 200");

    assert(
      deepCompareSkillResponses(res1.jsonData, res2.jsonData),
      "Call 1 and Call 2 should return identical skills",
    );
    assert(
      deepCompareSkillResponses(res2.jsonData, res3.jsonData),
      "Call 2 and Call 3 should return identical skills",
    );
  });

  // Test: /api/analyze-resume determinism
  await test("DETERMINISM: /api/analyze-resume returns identical output on 3 calls", async () => {
    const testPayload = {
      resumeText: "JavaScript React Node.js TypeScript",
      extractedSkills: [{ skill: "javascript" }, { skill: "react" }],
      inferredSkills: [{ skill: "Frontend", source: "JavaScript + React" }],
    };

    const res1 = new MockRes();
    const res2 = new MockRes();
    const res3 = new MockRes();

    const req1 = new MockReq("POST", testPayload);
    const req2 = new MockReq("POST", testPayload);
    const req3 = new MockReq("POST", testPayload);

    await analyzeHandler(req1, res1);
    await analyzeHandler(req2, res2);
    await analyzeHandler(req3, res3);

    assert.strictEqual(res1.statusCode, 200, "Call 1: Status 200");
    assert.strictEqual(res2.statusCode, 200, "Call 2: Status 200");
    assert.strictEqual(res3.statusCode, 200, "Call 3: Status 200");

    assert(
      deepCompareAnalyzeResponses(res1.jsonData, res2.jsonData),
      "Call 1 and Call 2 should return identical analysis",
    );
    assert(
      deepCompareAnalyzeResponses(res2.jsonData, res3.jsonData),
      "Call 2 and Call 3 should return identical analysis",
    );
  });

  // ====================================================================
  // Summary
  // ====================================================================
  console.log(`\n📊 Results: ${testsRun} tests, ${testsFailed} failed\n`);

  if (testsFailed === 0) {
    console.log("✅ All contract smoke tests passed!");
    console.log("   ✓ 200 + correct schema verified");
    console.log("   ✓ 400/405/413 error codes verified");
    console.log("   ✓ Determinism verified (3x repeat = identical output)");
    console.log("   ✓ ESM/runtime imports working (no errors)\n");
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
