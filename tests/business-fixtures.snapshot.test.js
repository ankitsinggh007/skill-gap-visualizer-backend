#!/usr/bin/env node
/**
 * BE-BIZ-002 — Golden Fixtures Snapshot (react/junior/unicorn only)
 *
 * Fixture-based regression suite for business outputs of /api/analyze-resume
 * using frozen fixture inputs (empty, partial, strong) to catch business logic
 * drift without relying on benchmark keyword counts.
 *
 * Run: node tests/business-fixtures.snapshot.test.js
 * Or:  npm run test:fixtures
 */

import assert from "node:assert/strict";
import analyzeHandler from "../api/analyze-resume.js";
import { MockReq, MockRes } from "./_mocks.js";

// =========================================================================
// Helper Functions
// =========================================================================

function asSkillObjs(arr) {
  return arr.map((s) => ({ skill: s }));
}

function getAllSkillNames(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => x.skill);
}

async function callAnalyze(input) {
  const req = new MockReq("POST", input);
  const res = new MockRes();
  await analyzeHandler(req, res);
  assert.equal(
    res.statusCode,
    200,
    `Expected 200, got ${res.statusCode}: ${JSON.stringify(res.jsonData)}`,
  );
  return res.jsonData;
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    process.exitCode = 1;
  }
}

/**
 * Assert that all recommendations are non-empty strings
 */
function assertRecommendationsValid(recommendations) {
  assert(Array.isArray(recommendations), "recommendations must be an array");
  for (let i = 0; i < recommendations.length; i++) {
    assert(
      typeof recommendations[i] === "string",
      `recommendations[${i}] is not a string`,
    );
    assert(
      recommendations[i].trim().length > 0,
      `recommendations[${i}] is empty or whitespace-only`,
    );
  }
}

// =========================================================================
// FIXTURE 1: EMPTY RESUME (baseline)
// =========================================================================

const fixtureEmpty = {
  resumeText: "-",
  extractedSkills: [],
  inferredSkills: [],
};

// =========================================================================
// FIXTURE 2: PARTIAL RESUME (mid-level skills)
// =========================================================================

const fixturePartial = {
  resumeText:
    "React component development with hooks and useState. " +
    "Used async/await for API calls. " +
    "Familiar with Git for version control. " +
    "Experience with ES6 syntax and arrow functions. " +
    "Worked with JSX to build UI components. " +
    "Used Vite as build tool.",
  extractedSkills: asSkillObjs([
    "React State",
    "Hooks",
    "Async/Await & Promises",
    "Git & Branching",
    "JSX",
    "Vite/Webpack Basics",
  ]),
  inferredSkills: [],
};

// =========================================================================
// FIXTURE 3: STRONG RESUME (comprehensive skills)
// =========================================================================

const fixtureStrong = {
  resumeText:
    "Expert React developer with 5+ years experience. " +
    "Advanced React Hooks, useState, useContext and state management with Redux/RTK and slices. " +
    "Built complex SPAs with React Router, useNavigate, useParams and route handling. " +
    "Deep Git knowledge including branching, commits, rebasing and cherry-pick. " +
    "Proficient in async/await, Promises, fetch, error handling with try/catch blocks. " +
    "Strong JSX and component composition with conditional rendering patterns. " +
    "Extensive Props drilling, context optimization, Context API usage, and state lifting. " +
    "ESLint and Prettier configuration expert for code quality and formatting. " +
    "Vite and Webpack optimization specialist for build performance and bundling. " +
    "Proven ability to debug async issues with async/await, event loop understanding, and call stack analysis. " +
    "Experience with lists, keys, forms, form validation, and controlled components. " +
    "Strong understanding of Error Boundaries, error handling strategies, and fallback UI. " +
    "Expert in closures, scope, prototypes, and JavaScript fundamentals. " +
    "Array methods like map, filter, reduce and object spreading patterns.",
  extractedSkills: asSkillObjs([
    "Hooks",
    "React State",
    "Redux/RTK",
    "React Router",
    "Git & Branching",
    "Async/Await & Promises",
    "JSX",
    "Props",
    "ESLint/Prettier",
    "Vite/Webpack Basics",
    "Context API",
    "Error Handling",
    "Lists & Keys",
    "Closures",
    "Prototypes",
    "Array & Object APIs",
    "Conditional Rendering",
    "Forms & Validation",
  ]),
  inferredSkills: [],
};

// =========================================================================
// KEY SKILLS REFERENCE
// =========================================================================

const expectedInEmpty = ["Hooks", "Redux/RTK", "React Router"];

const expectedInPartial = [
  "React State",
  "Hooks",
  "Async/Await & Promises",
  "Git & Branching",
  "JSX",
  "Vite/Webpack Basics",
];

const expectedMissingInPartial = ["Redux/RTK", "React Router"];

const expectedInStrong = [
  "Hooks",
  "React State",
  "Redux/RTK",
  "React Router",
  "Git & Branching",
  "Async/Await & Promises",
  "JSX",
  "Props",
  "ESLint/Prettier",
  "Vite/Webpack Basics",
  "Context API",
  "Error Handling",
  "Lists & Keys",
  "Closures",
  "Prototypes",
  "Array & Object APIs",
  "Conditional Rendering",
  "Forms & Validation",
];

// =========================================================================
// TEST SUITE
// =========================================================================

(async function run() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗",
  );
  console.log("║      BE-BIZ-002: Golden Fixtures Snapshot (react/junior)   ║");
  console.log(
    "║      Fixture-based regression suite for business outputs    ║",
  );
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  // =====================================================
  // FIXTURE 1: EMPTY RESUME
  // =====================================================
  console.log("\n📋 Fixture 1: Empty Resume (baseline)\n");

  let emptyResult;

  await test("Empty fixture returns valid response", async () => {
    emptyResult = await callAnalyze(fixtureEmpty);
    assert(emptyResult, "Response is falsy");
    assert(emptyResult.metadata, "Missing metadata");
    assert(emptyResult.matches, "Missing matches");
    assert(emptyResult.analysis, "Missing analysis");
  });

  await test("Empty: finalScore in [0, 5]", async () => {
    emptyResult = await callAnalyze(fixtureEmpty);
    const score = emptyResult.analysis.finalScore;
    assert(score >= 0 && score <= 5, `finalScore ${score} not in [0, 5]`);
  });

  await test("Empty: matchedSkills length is 0", async () => {
    emptyResult = await callAnalyze(fixtureEmpty);
    assert.equal(
      emptyResult.matches.matchedSkills.length,
      0,
      "matchedSkills should be empty",
    );
  });

  await test("Empty: missingSkills contains at least Hooks, Redux/RTK, React Router", async () => {
    emptyResult = await callAnalyze(fixtureEmpty);
    const missingNames = getAllSkillNames(emptyResult.matches.missingSkills);
    for (const skill of expectedInEmpty) {
      assert(
        missingNames.includes(skill),
        `Expected "${skill}" in missingSkills, but got: ${missingNames.join(", ")}`,
      );
    }
  });

  await test("Empty: recommendations is non-empty array of non-empty strings", async () => {
    emptyResult = await callAnalyze(fixtureEmpty);
    assertRecommendationsValid(emptyResult.analysis.recommendations);
    assert(
      emptyResult.analysis.recommendations.length > 0,
      "recommendations should not be empty for empty resume",
    );
  });

  // =====================================================
  // FIXTURE 2: PARTIAL RESUME
  // =====================================================
  console.log("\n📋 Fixture 2: Partial Resume (mid-level)\n");

  let partialResult;

  await test("Partial fixture returns valid response", async () => {
    partialResult = await callAnalyze(fixturePartial);
    assert(partialResult, "Response is falsy");
    assert(partialResult.metadata, "Missing metadata");
    assert(partialResult.matches, "Missing matches");
    assert(partialResult.analysis, "Missing analysis");
  });

  await test("Partial: finalScore in [25, 65]", async () => {
    partialResult = await callAnalyze(fixturePartial);
    const score = partialResult.analysis.finalScore;
    assert(score >= 25 && score <= 65, `finalScore ${score} not in [25, 65]`);
  });

  await test("Partial: matchedSkills contains expected skills", async () => {
    partialResult = await callAnalyze(fixturePartial);
    const matchedNames = getAllSkillNames(partialResult.matches.matchedSkills);
    for (const skill of expectedInPartial) {
      assert(
        matchedNames.includes(skill),
        `Expected "${skill}" in matchedSkills, but got: ${matchedNames.join(", ")}`,
      );
    }
  });

  await test("Partial: missingSkills includes Redux/RTK and React Router", async () => {
    partialResult = await callAnalyze(fixturePartial);
    const missingNames = getAllSkillNames(partialResult.matches.missingSkills);
    for (const skill of expectedMissingInPartial) {
      assert(
        missingNames.includes(skill),
        `Expected "${skill}" in missingSkills, but got: ${missingNames.join(", ")}`,
      );
    }
  });

  await test("Partial: matchedSkills does not contain Redux/RTK or React Router", async () => {
    partialResult = await callAnalyze(fixturePartial);
    const matchedNames = getAllSkillNames(partialResult.matches.matchedSkills);
    for (const skill of expectedMissingInPartial) {
      assert(
        !matchedNames.includes(skill),
        `Unexpected "${skill}" in matchedSkills`,
      );
    }
  });

  await test("Partial: recommendations is array of non-empty strings", async () => {
    partialResult = await callAnalyze(fixturePartial);
    assertRecommendationsValid(partialResult.analysis.recommendations);
  });

  // =====================================================
  // FIXTURE 3: STRONG RESUME
  // =====================================================
  console.log("\n📋 Fixture 3: Strong Resume (comprehensive)\n");

  let strongResult;

  await test("Strong fixture returns valid response", async () => {
    strongResult = await callAnalyze(fixtureStrong);
    assert(strongResult, "Response is falsy");
    assert(strongResult.metadata, "Missing metadata");
    assert(strongResult.matches, "Missing matches");
    assert(strongResult.analysis, "Missing analysis");
  });

  await test("Strong: finalScore in [70, 95]", async () => {
    strongResult = await callAnalyze(fixtureStrong);
    const score = strongResult.analysis.finalScore;
    assert(score >= 70 && score <= 95, `finalScore ${score} not in [70, 95]`);
  });

  await test("Strong: matchedSkills contains all key skills", async () => {
    strongResult = await callAnalyze(fixtureStrong);
    const matchedNames = getAllSkillNames(strongResult.matches.matchedSkills);
    for (const skill of expectedInStrong) {
      assert(
        matchedNames.includes(skill),
        `Expected "${skill}" in matchedSkills, but got: ${matchedNames.join(", ")}`,
      );
    }
  });

  await test("Strong: expectedInStrong skills NOT in missingSkills", async () => {
    strongResult = await callAnalyze(fixtureStrong);
    const missingNames = getAllSkillNames(strongResult.matches.missingSkills);
    for (const skill of expectedInStrong) {
      assert(
        !missingNames.includes(skill),
        `Unexpected "${skill}" in missingSkills`,
      );
    }
  });

  await test("Strong: recommendations is array of non-empty strings", async () => {
    strongResult = await callAnalyze(fixtureStrong);
    assertRecommendationsValid(strongResult.analysis.recommendations);
  });

  // =====================================================
  // DETERMINISM TESTS
  // =====================================================
  console.log("\n📋 Determinism Tests\n");

  await test("Empty: Same input twice yields same finalScore", async () => {
    const r1 = await callAnalyze(fixtureEmpty);
    const r2 = await callAnalyze(fixtureEmpty);
    assert.equal(
      r1.analysis.finalScore,
      r2.analysis.finalScore,
      "finalScore differs on re-run",
    );
  });

  await test("Empty: Same input twice yields same recommendations (deep-equal)", async () => {
    const r1 = await callAnalyze(fixtureEmpty);
    const r2 = await callAnalyze(fixtureEmpty);
    assert.deepEqual(
      r1.analysis.recommendations,
      r2.analysis.recommendations,
      "recommendations differ on re-run",
    );
  });

  await test("Partial: Same input twice yields same finalScore", async () => {
    const r1 = await callAnalyze(fixturePartial);
    const r2 = await callAnalyze(fixturePartial);
    assert.equal(
      r1.analysis.finalScore,
      r2.analysis.finalScore,
      "finalScore differs on re-run",
    );
  });

  await test("Partial: Same input twice yields same recommendations (deep-equal)", async () => {
    const r1 = await callAnalyze(fixturePartial);
    const r2 = await callAnalyze(fixturePartial);
    assert.deepEqual(
      r1.analysis.recommendations,
      r2.analysis.recommendations,
      "recommendations differ on re-run",
    );
  });

  await test("Strong: Same input twice yields same finalScore", async () => {
    const r1 = await callAnalyze(fixtureStrong);
    const r2 = await callAnalyze(fixtureStrong);
    assert.equal(
      r1.analysis.finalScore,
      r2.analysis.finalScore,
      "finalScore differs on re-run",
    );
  });

  await test("Strong: Same input twice yields same recommendations (deep-equal)", async () => {
    const r1 = await callAnalyze(fixtureStrong);
    const r2 = await callAnalyze(fixtureStrong);
    assert.deepEqual(
      r1.analysis.recommendations,
      r2.analysis.recommendations,
      "recommendations differ on re-run",
    );
  });

  // =====================================================
  // MONOTONICITY: Score increases with more skills
  // =====================================================
  console.log("\n📋 Monotonicity Tests\n");

  await test("Score progression: empty < partial < strong", async () => {
    const r1 = await callAnalyze(fixtureEmpty);
    const r2 = await callAnalyze(fixturePartial);
    const r3 = await callAnalyze(fixtureStrong);

    const s1 = r1.analysis.finalScore;
    const s2 = r2.analysis.finalScore;
    const s3 = r3.analysis.finalScore;

    assert(s1 < s2, `Empty (${s1}) should be < Partial (${s2})`);
    assert(s2 < s3, `Partial (${s2}) should be < Strong (${s3})`);
  });

  // =====================================================
  // NO BRITTLE BENCHMARK DEPENDENCY
  // =====================================================
  console.log("\n📋 Non-Brittle Assertions\n");

  await test("Empty: atsReadiness.total > 0 (but not locked value)", async () => {
    emptyResult = await callAnalyze(fixtureEmpty);
    assert(
      emptyResult.analysis.atsReadiness.total > 0,
      "atsReadiness.total should be > 0",
    );
  });

  await test("Partial: atsReadiness.total > 0 (but not locked value)", async () => {
    partialResult = await callAnalyze(fixturePartial);
    assert(
      partialResult.analysis.atsReadiness.total > 0,
      "atsReadiness.total should be > 0",
    );
  });

  await test("Strong: atsReadiness.total > 0 (but not locked value)", async () => {
    strongResult = await callAnalyze(fixtureStrong);
    assert(
      strongResult.analysis.atsReadiness.total > 0,
      "atsReadiness.total should be > 0",
    );
  });

  // =====================================================
  // SUMMARY
  // =====================================================
  if (!process.exitCode) {
    console.log("\n✅ BE-BIZ-002 Golden Fixtures Snapshot: ALL TESTS PASSED\n");
  } else {
    console.log(
      "\n❌ BE-BIZ-002 Golden Fixtures Snapshot: SOME TESTS FAILED\n",
    );
  }
})();
