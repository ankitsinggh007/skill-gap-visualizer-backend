import {
  cleanSkillName,
  normalizeExtractedSkills,
  normalizeInferredSkills,
  mergeSkills,
  normalizeSkills,
} from "../normalizeSkills.js";

// Manual assertion helper
function assertEqual(actual, expected, message) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) {
    console.error("❌ Test Failed:", message);
    console.error("   Expected:", expected);
    console.error("   Received:", actual);
  } else {
    console.log("✅", message);
  }
}

/* --------------------------------------------------
   TESTING cleanSkillName()
---------------------------------------------------*/
console.log("\n=== Testing cleanSkillName() ===");

assertEqual(cleanSkillName("  React "), "react", "Trims & lowercases");
assertEqual(cleanSkillName("React   Hooks"), "react hooks", "Collapses spaces");
assertEqual(cleanSkillName("  JAVASCRIPT"), "javascript", "Upper → lower");
assertEqual(cleanSkillName(""), "", "Empty string");
assertEqual(cleanSkillName(null), "", "Null returns empty");
assertEqual(cleanSkillName(123), "", "Non-string returns empty");

/* --------------------------------------------------
   TESTING normalizeExtractedSkills()
---------------------------------------------------*/
console.log("\n=== Testing normalizeExtractedSkills() ===");

assertEqual(
  normalizeExtractedSkills([{ skill: "React" }, { skill: " JavaScript " }]),
  ["react", "javascript"],
  "Extracted normalization basic"
);

assertEqual(
  normalizeExtractedSkills([{ skill: "" }, { skill: "   " }]),
  [],
  "Ignores empty extracted skills"
);

assertEqual(
  normalizeExtractedSkills([{ skill: "REACT" }, { skill: "react" }]),
  ["react", "react"],
  "Duplicates allowed here (deduped later)"
);

assertEqual(
  normalizeExtractedSkills([{}, { skill: 123 }]),
  [],
  "Invalid entries dropped"
);

/* --------------------------------------------------
   TESTING normalizeInferredSkills()
---------------------------------------------------*/
console.log("\n=== Testing normalizeInferredSkills() ===");

assertEqual(
  normalizeInferredSkills([
    { skill: "REST APIs", source: "mentioned" },
    { skill: "   Hooks  ", source: "pattern" },
  ]),
  [
    { skill: "rest apis", source: "mentioned" },
    { skill: "hooks", source: "pattern" },
  ],
  "Inferred normalization preserves source"
);

assertEqual(
  normalizeInferredSkills([{ skill: "" }, { skill: "   " }]),
  [],
  "Ignores empty inferred skills"
);

assertEqual(
  normalizeInferredSkills([{ skill: "React" }, { skill: "React", source: "" }]),
  [
    { skill: "react", source: "" },
    { skill: "react", source: "" },
  ],
  "Duplicates allowed here (deduped later)"
);

assertEqual(
  normalizeInferredSkills([{ skill: 999 }, { foo: "bar" }]),
  [],
  "Invalid inferred entries removed"
);

/* --------------------------------------------------
   TESTING mergeSkills()
---------------------------------------------------*/
console.log("\n=== Testing mergeSkills() ===");

assertEqual(
  mergeSkills(
    ["react", "javascript"],
    [{ skill: "rest apis" }, { skill: "react" }]
  ),
  ["react", "javascript", "rest apis"],
  "Merges extracted + inferred without duplicates"
);

/* --------------------------------------------------
   TESTING normalizeSkills() — Full Pipeline
---------------------------------------------------*/
console.log("\n=== Testing normalizeSkills() FULL PIPELINE ===");

const fullInput = {
  extractedSkills: [
    { skill: " React " },
    { skill: "JAVASCRIPT" },
    { skill: "" },
  ],

  inferredSkills: [
    { skill: "REST  APIs", source: "mentioned in text" },
    { skill: "react", source: "weak match" },
    { skill: "   " },
  ],
};

const fullOutput = normalizeSkills(
  fullInput.extractedSkills,
  fullInput.inferredSkills,
);

assertEqual(
  fullOutput.extracted,
  ["react", "javascript"],
  "Full pipeline → extracted normalized"
);

assertEqual(
  fullOutput.inferred,
  [
    { skill: "rest apis", source: "mentioned in text" },
    { skill: "react", source: "weak match" },
  ],
  "Full pipeline → inferred normalized"
);

assertEqual(
  fullOutput.allSkills.sort(),
  ["react", "javascript", "rest apis"].sort(),
  "Full pipeline → allSkills merged & deduped"
);

/* --------------------------------------------------
   Edge Case: Everything Missing
---------------------------------------------------*/
console.log("\n=== Testing Edge Cases ===");

assertEqual(
  normalizeSkills([], []),
  {
    extracted: [],
    inferred: [],
    allSkills: [],
  },
  "Handles empty input gracefully"
);

assertEqual(
  normalizeSkills(null, null),
  {
    extracted: [],
    inferred: [],
    allSkills: [],
  },
  "Handles null inputs gracefully"
);

console.log("\n🎉 ALL TESTS COMPLETED\n");
