// tests/scoringEngine.test.js

import {
  scoreSkill,
  scoreCategory,
  scoreExperience,
  computeScore,
} from "../scoringEngine.js";

// Mock Benchmark Structure
const mockBenchmark = {
  expectedExperienceRange: { min: 1, max: 3 },

  categories: [
    {
      name: "JavaScript",
      weight: 0.50,
      skills: [
        { name: "Closures", weight: 0.20 },
        { name: "Promises", weight: 0.20 },
        { name: "Event Loop", weight: 0.10 },
      ],
    },
    {
      name: "React",
      weight: 0.50,
      skills: [
        { name: "Hooks", weight: 0.30 },
        { name: "Context", weight: 0.20 },
      ],
    },
  ],
};

// Helper: Pretty Output
function print(title, data) {
  console.log("\n=== " + title + " ===");
  console.dir(data, { depth: 10 });
}

console.log("\n\n🧪 RUNNING SCORING ENGINE TESTS...\n");

// -------------------------------------------------------------
// TEST 1: Skill scoring — explicit vs weak vs missing
// -------------------------------------------------------------
const test1 = {
  explicit: scoreSkill(0.20, "explicit"), // should be full weight
  weak: scoreSkill(0.20, "weak"),         // should be 0.6 * weight
  missing: scoreSkill(0.20, "missing"),   // should be 0
};

print("TEST 1 — scoreSkill()", test1);

// -------------------------------------------------------------
// TEST 2: Category scoring
// -------------------------------------------------------------
const test2 = {
  categoryScore: scoreCategory(
    mockBenchmark.categories[0],
    [
      { skill: "Closures", score: 0.20, type: "explicit" },
      { skill: "Promises", score: 0.12, type: "weak" },
      { skill: "Event Loop", score: 0, type: "missing" },
    ]
  ),
};

print("TEST 2 — scoreCategory()", test2);

// -------------------------------------------------------------
// TEST 3: Experience scoring
// -------------------------------------------------------------
const test3 = {
  tooLow: scoreExperience(0, { min: 1, max: 3 }),   // 0.02
  insideRange: scoreExperience(2, { min: 1, max: 3 }), // 0.05
  aboveRange: scoreExperience(5, { min: 1, max: 3 }), // 0.04
};

print("TEST 3 — scoreExperience()", test3);

// -------------------------------------------------------------
// TEST 4: Full computeScore() — Strong case
// -------------------------------------------------------------
const matchStrong = {
  matchedSkills: [
    { skill: "Closures", category: "JavaScript", type: "explicit" },
    { skill: "Promises", category: "JavaScript", type: "explicit" },
    { skill: "Hooks", category: "React", type: "explicit" },
  ],
  weakSignals: [
    { skill: "Event Loop", category: "JavaScript", type: "weak" },
    { skill: "Context", category: "React", type: "weak" },
  ],
  missingSkills: [],
};

const test4 = computeScore(matchStrong, mockBenchmark, 2);
print("TEST 4 — computeScore() STRONG", test4);

// -------------------------------------------------------------
// TEST 5: Full computeScore() — Weak candidate
// -------------------------------------------------------------
const matchWeak = {
  matchedSkills: [ { skill: "Hooks", category: "React", type: "explicit" } ],
  weakSignals: [],
  missingSkills: [
    { skill: "Closures" },
    { skill: "Promises" },
    { skill: "Event Loop" },
    { skill: "Context" },
  ],
};

const test5 = computeScore(matchWeak, mockBenchmark, 0);
print("TEST 5 — computeScore() WEAK", test5);

// -------------------------------------------------------------
// TEST 6: Full computeScore() — High-risk candidate
// -------------------------------------------------------------
const matchHighRisk = {
  matchedSkills: [],
  weakSignals: [],
  missingSkills: [
    { skill: "Closures" },
    { skill: "Promises" },
    { skill: "Event Loop" },
    { skill: "Hooks" },
    { skill: "Context" },
  ],
};

const test6 = computeScore(matchHighRisk, mockBenchmark, 0);
print("TEST 6 — computeScore() HIGH RISK", test6);

// -------------------------------------------------------------
// TEST 7: Weak signals only (edge case)
// -------------------------------------------------------------
const matchWeakSignals = {
  matchedSkills: [],
  weakSignals: [
    { skill: "Closures" },
    { skill: "Hooks" },
  ],
  missingSkills: [
    { skill: "Promises" },
    { skill: "Event Loop" },
    { skill: "Context" },
  ],
};

const test7 = computeScore(matchWeakSignals, mockBenchmark, 1);
print("TEST 7 — computeScore() weak-signal-only", test7);

// -------------------------------------------------------------
// TEST 8: All explicit (perfect resume)
// -------------------------------------------------------------
const matchPerfect = {
  matchedSkills: [
    { skill: "Closures" }, 
    { skill: "Promises" },
    { skill: "Event Loop" },
    { skill: "Hooks" },
    { skill: "Context" },
  ],
  weakSignals: [],
  missingSkills: [],
};

const test8 = computeScore(matchPerfect, mockBenchmark, 2);
print("TEST 8 — computeScore() PERFECT", test8);

// -------------------------------------------------------------
// TEST 9: Experience ONLY (no skills)
// -------------------------------------------------------------
const matchNone = {
  matchedSkills: [],
  weakSignals: [],
  missingSkills: [
    { skill: "Closures" },
    { skill: "Promises" },
    { skill: "Event Loop" },
    { skill: "Hooks" },
    { skill: "Context" },
  ],
};

const test9 = computeScore(matchNone, mockBenchmark, 2);
print("TEST 9 — computeScore() ONLY EXPERIENCE", test9);

// -------------------------------------------------------------
// TEST 10: Mixed random case
// -------------------------------------------------------------
const matchMixed = {
  matchedSkills: [
    { skill: "Event Loop" },
  ],
  weakSignals: [
    { skill: "Closures" },
  ],
  missingSkills: [
    { skill: "Promises" },
    { skill: "Hooks" },
    { skill: "Context" },
  ],
};

const test10 = computeScore(matchMixed, mockBenchmark, 1);
print("TEST 10 — computeScore() random mix", test10);