#!/usr/bin/env node
import assert from "node:assert/strict";
import analyzeHandler from "../api/analyze-resume.js";
import { MockReq, MockRes } from "./_mocks.js";

/**
 * BE-BIZ-001 — Business sanity tests (react/junior/unicorn hardcoded)
 * Locked facts from your proof:
 * - matches has: matchedSkills, weakSignals, missingSkills
 * - atsReadiness.total = 80
 * - ATS keyword "microtask" exists in benchmark keywords
 * - Hooks weak synonym phrase exists: "react hooks"
 */

function asSkillObjs(arr) {
  return arr.map((s) => ({ skill: s }));
}

function keyifySkills(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => `${x.skill}|||${x.category}|||${x.type ?? ""}`).sort();
}

function hasSkill(arr, skillName) {
  if (!Array.isArray(arr)) return false;
  return arr.some((x) => x.skill === skillName);
}

function deepNoNaNOrUndefined(obj, path = "$") {
  if (obj === undefined) throw new Error(`Undefined at ${path}`);
  if (typeof obj === "number" && Number.isNaN(obj))
    throw new Error(`NaN at ${path}`);
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj))
      deepNoNaNOrUndefined(v, `${path}.${k}`);
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++)
      deepNoNaNOrUndefined(obj[i], `${path}[${i}]`);
  }
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
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(`  ${e.message}`);
    process.exitCode = 1;
  }
}

(async function run() {
  console.log("\nBE-BIZ-001: Business sanity tests\n");

  // Fixture: Partial baseline (NO microtask)
  const fixtureBase = {
    resumeText: "react useEffect fetch promise git collaborated",
    extractedSkills: asSkillObjs(["Git & Branching", "Async/Await & Promises"]),
    inferredSkills: [],
  };

  // 1) Determinism
  await test("Determinism: same input -> same score + same match sets", async () => {
    const a = await callAnalyze(fixtureBase);
    const b = await callAnalyze(fixtureBase);

    assert.equal(
      a.analysis.finalScore,
      b.analysis.finalScore,
      "finalScore differs",
    );
    assert.deepEqual(
      keyifySkills(a.matches.matchedSkills),
      keyifySkills(b.matches.matchedSkills),
      "matchedSkills differs",
    );
    assert.deepEqual(
      keyifySkills(a.matches.weakSignals),
      keyifySkills(b.matches.weakSignals),
      "weakSignals differs",
    );
    assert.deepEqual(
      keyifySkills(a.matches.missingSkills),
      keyifySkills(b.matches.missingSkills),
      "missingSkills differs",
    );

    assert.equal(
      a.analysis.atsReadiness.percentage,
      b.analysis.atsReadiness.percentage,
      "ATS percentage differs",
    );
  });

  // 2) No NaN/undefined anywhere
  await test("No NaN/undefined in full response", async () => {
    const r = await callAnalyze(fixtureBase);
    deepNoNaNOrUndefined(r);
  });

  // 3) ATS sensitivity using guaranteed keyword "microtask" (total is locked at 80)
  await test('ATS sensitivity: adding "microtask" increases matchedKeywords and percentage', async () => {
    const base = await callAnalyze(fixtureBase);

    const plus = await callAnalyze({
      ...fixtureBase,
      resumeText: fixtureBase.resumeText + " microtask",
    });

    const baseAts = base.analysis.atsReadiness;
    const plusAts = plus.analysis.atsReadiness;

    assert.equal(baseAts.total, 80, "ATS total is not 80 (contract drift)");
    assert.equal(plusAts.total, 80, "ATS total is not 80 (contract drift)");

    assert(
      !baseAts.matchedKeywords.includes("microtask"),
      "baseline already contains microtask",
    );
    assert(
      plusAts.matchedKeywords.includes("microtask"),
      "microtask not added to matchedKeywords",
    );

    assert(
      plusAts.percentage > baseAts.percentage,
      `ATS% did not increase: ${baseAts.percentage} -> ${plusAts.percentage}`,
    );
    assert(
      plusAts.percentage >= 0 && plusAts.percentage <= 1,
      "ATS percentage must be a 0..1 ratio",
    );

    // Optional strict math: should increase by exactly 100/80 = 1.25 (within tolerance)
    const expectedDelta = 1 / plusAts.total; // because atsReadiness.percentage is 0..1 ratio

    const actualDelta = plusAts.percentage - baseAts.percentage;
    assert(
      Math.abs(actualDelta - expectedDelta) <= 0.0001,
      `ATS delta mismatch: expected ${expectedDelta}, got ${actualDelta}`,
    );
  });

  // 4) Monotonicity: adding high-impact explicit skill should increase score + move skill from missing to matched
  await test("Monotonicity: add Redux/RTK explicitly -> score increases and Redux/RTK becomes matched", async () => {
    const oldR = await callAnalyze(fixtureBase);

    const newR = await callAnalyze({
      ...fixtureBase,
      extractedSkills: asSkillObjs([
        "Git & Branching",
        "Async/Await & Promises",
        "Redux/RTK",
      ]),
    });

    assert(
      newR.analysis.finalScore > oldR.analysis.finalScore,
      `Score did not increase: ${oldR.analysis.finalScore} -> ${newR.analysis.finalScore}`,
    );

    assert(
      hasSkill(newR.matches.matchedSkills, "Redux/RTK"),
      "Redux/RTK not found in matchedSkills after adding explicitly",
    );
    assert(
      !hasSkill(newR.matches.missingSkills, "Redux/RTK"),
      "Redux/RTK still in missingSkills after explicit add",
    );

    // sanity: matchedSkills should not shrink
    assert(
      newR.matches.matchedSkills.length >= oldR.matches.matchedSkills.length,
      "matchedSkills count decreased",
    );
  });

  // 5) Weak-signal: Hooks should land in weakSignals when not explicit but hinted by dict weak phrase
  await test('Weak-signal: "Hooks" appears in weakSignals when resumeText contains "react hooks" but Hooks not explicit', async () => {
    // IMPORTANT: keep extractedSkills minimal (avoid "React State" etc) to prevent Hooks becoming explicit via keyword overlap.
    const r = await callAnalyze({
      resumeText: "react hooks useEffect fetch promise git collaborated",
      extractedSkills: asSkillObjs([
        "Git & Branching",
        "Async/Await & Promises",
      ]),
      inferredSkills: [],
    });

    assert(
      !hasSkill(r.matches.matchedSkills, "Hooks"),
      "Hooks unexpectedly became explicit (matchedSkills)",
    );
    assert(
      hasSkill(r.matches.weakSignals, "Hooks"),
      "Hooks not found in weakSignals",
    );
  });

  if (!process.exitCode) console.log("\n✅ BE-BIZ-001 passed.\n");
  else
    console.log(
      "\n❌ BE-BIZ-001 failed (business logic drift or spec mismatch).\n",
    );
})();
