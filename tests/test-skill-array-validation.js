#!/usr/bin/env node
/**
 * Test: Skill Array Validation & Sanitization (BE-P1-003)
 * Tests normalizeSkillArrays and API integration
 */

import {
  normalizeSkillArrays,
  SkillArrayError,
} from "../lib/analyze/normalize/normalizeSkillArrays.js";

console.log("🧪 Skill Array Validation Tests (BE-P1-003)\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${err.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Test 1: Valid extracted skills
test("Valid extracted skills array", () => {
  const result = normalizeSkillArrays({
    extractedSkills: [{ skill: "JavaScript" }, { skill: "React" }],
    inferredSkills: [],
  });
  assert(result.extractedSkills.length === 2, "Should have 2 items");
  assert(result.extractedSkills[0].skill === "javascript", "Should lowercase");
});

// Test 2: Valid inferred skills
test("Valid inferred skills array", () => {
  const result = normalizeSkillArrays({
    extractedSkills: [],
    inferredSkills: [
      {
        skill: "Frontend Framework",
        source: "Detected keyword",
      },
    ],
  });
  assert(result.inferredSkills.length === 1, "Should have 1 item");
  assert(
    result.inferredSkills[0].skill === "Frontend Framework",
    "Should preserve casing",
  );
});

// Test 3: Trim whitespace
test("Trim whitespace from skills", () => {
  const result = normalizeSkillArrays({
    extractedSkills: [{ skill: "  JavaScript  " }],
    inferredSkills: [],
  });
  assert(result.extractedSkills[0].skill === "javascript", "Should trim");
});

// Test 4: Drop empty entries
test("Drop empty skill entries", () => {
  const result = normalizeSkillArrays({
    extractedSkills: [
      { skill: "JavaScript" },
      { skill: "   " },
      { skill: "React" },
    ],
    inferredSkills: [],
  });
  assert(result.extractedSkills.length === 2, "Should drop empty");
  assert(result.extractedSkills[1].skill === "react", "React should be second");
});

// Test 5: Drop empty inferred entries
test("Drop empty inferred skill entries", () => {
  const result = normalizeSkillArrays({
    extractedSkills: [],
    inferredSkills: [
      { skill: "Skill1", source: "Source1" },
      { skill: "   ", source: "Source2" },
      { skill: "Skill3", source: "Source3" },
    ],
  });
  assert(result.inferredSkills.length === 2, "Should drop empty");
});

// Test 6: extractedSkills not array
test("Reject extractedSkills if not array", () => {
  try {
    normalizeSkillArrays({
      extractedSkills: "not an array",
      inferredSkills: [],
    });
    throw new Error("Should have thrown");
  } catch (err) {
    assert(err instanceof SkillArrayError, "Should throw SkillArrayError");
    assert(
      err.message.includes("must be an array"),
      "Should mention array requirement",
    );
  }
});

// Test 7: inferredSkills not array
test("Reject inferredSkills if not array", () => {
  try {
    normalizeSkillArrays({
      extractedSkills: [],
      inferredSkills: { skill: "x", source: "y" },
    });
    throw new Error("Should have thrown");
  } catch (err) {
    assert(err instanceof SkillArrayError, "Should throw SkillArrayError");
  }
});

// Test 8: extractedSkills with non-object element
test("Reject extractedSkills with non-object", () => {
  try {
    normalizeSkillArrays({
      extractedSkills: [{ skill: "JS" }, "not-object"],
      inferredSkills: [],
    });
    throw new Error("Should have thrown");
  } catch (err) {
    assert(err instanceof SkillArrayError, "Should throw");
    assert(err.details.index === 1, "Should identify index");
  }
});

// Test 9: extractedSkills item without 'skill' property
test("Reject extractedSkills missing skill property", () => {
  try {
    normalizeSkillArrays({
      extractedSkills: [{ name: "JavaScript" }],
      inferredSkills: [],
    });
    throw new Error("Should have thrown");
  } catch (err) {
    assert(err instanceof SkillArrayError, "Should throw");
    assert(err.details.index === 0, "Should identify index");
    assert(
      err.details.reason === "missing_skill_property",
      "Should describe reason",
    );
  }
});

// Test 10: extractedSkills skill not string
test("Reject extractedSkills with non-string skill", () => {
  try {
    normalizeSkillArrays({
      extractedSkills: [{ skill: 123 }],
      inferredSkills: [],
    });
    throw new Error("Should have thrown");
  } catch (err) {
    assert(err instanceof SkillArrayError, "Should throw");
    assert(err.details.index === 0, "Should identify index");
    assert(err.details.received === "number", "Should identify type");
  }
});

// Test 11: inferredSkills missing source property
test("Reject inferredSkills missing source property", () => {
  try {
    normalizeSkillArrays({
      extractedSkills: [],
      inferredSkills: [{ skill: "Frontend" }],
    });
    throw new Error("Should have thrown");
  } catch (err) {
    assert(err instanceof SkillArrayError, "Should throw");
    assert(
      err.details.reason === "missing_source_property",
      "Should describe reason",
    );
  }
});

// Test 12: inferredSkills source not string
test("Reject inferredSkills with non-string source", () => {
  try {
    normalizeSkillArrays({
      extractedSkills: [],
      inferredSkills: [{ skill: "Frontend", source: 123 }],
    });
    throw new Error("Should have thrown");
  } catch (err) {
    assert(err instanceof SkillArrayError, "Should throw");
    assert(err.details.index === 0, "Should identify index");
    assert(err.details.received === "number", "Should identify type");
  }
});

// Test 13: Empty arrays are valid
test("Accept empty skill arrays", () => {
  const result = normalizeSkillArrays({
    extractedSkills: [],
    inferredSkills: [],
  });
  assert(result.extractedSkills.length === 0, "Should handle empty");
  assert(result.inferredSkills.length === 0, "Should handle empty");
});

// Test 14: Complex valid input
test("Accept complex valid input", () => {
  const result = normalizeSkillArrays({
    extractedSkills: [
      { skill: "  JavaScript  " },
      { skill: "React" },
      { skill: "Node.js" },
    ],
    inferredSkills: [
      { skill: "  Frontend Framework  ", source: "Keyword detection" },
      { skill: "Runtime", source: "Pattern match" },
    ],
  });
  assert(result.extractedSkills.length === 3, "Should have 3 extracted");
  assert(result.inferredSkills.length === 2, "Should have 2 inferred");
  assert(
    result.extractedSkills[0].skill === "javascript",
    "Should normalize first",
  );
});

// Test 15: Trim source in inferred
test("Trim source text in inferred skills", () => {
  const result = normalizeSkillArrays({
    extractedSkills: [],
    inferredSkills: [
      {
        skill: "Skill",
        source: "  Source with spaces  ",
      },
    ],
  });
  assert(
    result.inferredSkills[0].source === "Source with spaces",
    "Should trim",
  );
});

// Test 16: Preserve inferred skill casing
test("Preserve casing in inferred skill names", () => {
  const result = normalizeSkillArrays({
    extractedSkills: [],
    inferredSkills: [
      {
        skill: "Frontend Framework",
        source: "Pattern detection",
      },
      {
        skill: "Programming Language",
        source: "Keyword match",
      },
    ],
  });
  assert(
    result.inferredSkills[0].skill === "Frontend Framework",
    "Should not lowercase Frontend Framework",
  );
  assert(
    result.inferredSkills[1].skill === "Programming Language",
    "Should not lowercase Programming Language",
  );
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("✅ All tests passed!");
  process.exit(0);
} else {
  console.log("❌ Some tests failed");
  process.exit(1);
}
