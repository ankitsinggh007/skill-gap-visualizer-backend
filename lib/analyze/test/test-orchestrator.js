import assert from "node:assert/strict";
import { analyzeResume } from "../index.js";
import { loadBenchmark } from "../../benchmark/loader.js";

let testsRun = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsRun++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  ${err.message}`);
    testsFailed++;
  }
}

async function asyncTest(name, fn) {
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

function hasSkill(arr, skillName) {
  return Array.isArray(arr) && arr.some((x) => x.skill === skillName);
}

function keyifySkills(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => `${x.skill}|||${x.category}|||${x.type ?? ""}`).sort();
}

console.log("\nANALYZE ORCHESTRATOR: FULL PIPELINE TESTS\n");

// ------------------------------------------------------------------
// 1) Empty resume returns error with metadata
// ------------------------------------------------------------------
await asyncTest("Empty/whitespace resume returns error", async () => {
  const result = await analyzeResume({
    resumeText: "   ",
    extractedSkills: [],
    inferredSkills: [],
  });

  assert(result.error, "Expected error for empty resume");
  assert.equal(
    result.error,
    "Resume text is required.",
    "Unexpected error message",
  );
  assert(result.metadata, "Expected metadata on error");
});

// ------------------------------------------------------------------
// 2) Full coverage: all benchmark skills explicitly provided
// ------------------------------------------------------------------
await asyncTest("Full coverage yields no missing/weak skills", async () => {
  const benchmark = loadBenchmark("react", "junior", "unicorn");
  assert(benchmark, "Benchmark not found");

  const allSkillNames = benchmark.categories.flatMap((cat) =>
    cat.skills.map((s) => s.name),
  );

  const result = await analyzeResume({
    resumeText: "Full coverage resume with explicit skills.",
    extractedSkills: allSkillNames.map((skill) => ({ skill })),
    inferredSkills: [],
    role: "react",
    level: "junior",
    companyType: "unicorn",
  });

  assert(!result.error, `Unexpected error: ${result.error}`);
  assert.equal(
    result.matches.missingSkills.length,
    0,
    "missingSkills should be empty",
  );
  assert.equal(
    result.matches.weakSignals.length,
    0,
    "weakSignals should be empty",
  );
  assert.equal(
    result.matches.matchedSkills.length,
    allSkillNames.length,
    "matchedSkills should cover all benchmark skills",
  );
});

// ------------------------------------------------------------------
// 3) Mixed input shapes normalize into explicit matches
// ------------------------------------------------------------------
await asyncTest("Mixed skill input shapes are normalized", async () => {
  const result = await analyzeResume({
    resumeText: "React hooks and state management.",
    extractedSkills: ["React State", { name: "Hooks" }],
    inferredSkills: [{ skill: "JSX", source: "mentioned in text" }],
  });

  assert(!result.error, `Unexpected error: ${result.error}`);
  assert(hasSkill(result.matches.matchedSkills, "Hooks"), "Hooks not matched");
  assert(
    hasSkill(result.matches.matchedSkills, "React State"),
    "React State not matched",
  );
});

// ------------------------------------------------------------------
// 4) ATS phrase matching works for multi-word keywords
// ------------------------------------------------------------------
await asyncTest("ATS phrase match includes multi-word keywords", async () => {
  const result = await analyzeResume({
    resumeText: "I understand the event loop and microtask queue.",
    extractedSkills: [],
    inferredSkills: [],
  });

  assert(!result.error, `Unexpected error: ${result.error}`);
  const ats = result.analysis.atsReadiness;
  assert(
    ats.matchedKeywords.includes("event loop"),
    "event loop not detected in ATS matchedKeywords",
  );
});

// ------------------------------------------------------------------
// 5) Determinism: same input -> same output
// ------------------------------------------------------------------
await asyncTest("Determinism: same input yields same scores/matches", async () => {
  const input = {
    resumeText: "React hooks useEffect fetch promise git collaborated",
    extractedSkills: [{ skill: "Git & Branching" }],
    inferredSkills: [],
  };

  const a = await analyzeResume(input);
  const b = await analyzeResume(input);

  assert.equal(a.analysis.finalScore, b.analysis.finalScore, "Score differs");
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
});

// ------------------------------------------------------------------
// Summary
// ------------------------------------------------------------------
console.log(`\nResults: ${testsRun - testsFailed} passed, ${testsFailed} failed`);
process.exit(testsFailed > 0 ? 1 : 0);
