#!/usr/bin/env node
/**
 * Brain QA suite (benchmark + dictionary behavior) — /api/analyze-resume only
 *
 * HARD tests = must pass (engine + contract invariants)
 * SOFT tests = warnings (dictionary/keyword "brain quality" checks)
 *
 * Run:
 *   node tests/brain-qa.test.js
 */

import assert from "node:assert/strict";
import analyzeHandler from "../api/analyze-resume.js";
import { MockReq, MockRes } from "./_mocks.js";

// ------------------------- helpers -------------------------

function asSkillObjs(arr) {
  return arr.map((s) => ({ skill: s }));
}

function names(arr) {
  return Array.isArray(arr) ? arr.map((x) => x.skill) : [];
}

function hasSkill(arr, skillName) {
  return Array.isArray(arr) && arr.some((x) => x.skill === skillName);
}

function deepNoNaNOrUndefined(obj, path = "$") {
  if (obj === undefined) throw new Error(`Undefined at ${path}`);
  if (typeof obj === "number" && Number.isNaN(obj))
    throw new Error(`NaN at ${path}`);
  if (typeof obj === "number") {
    assert(Number.isFinite(obj), `Non-finite number at ${path}: ${obj}`);
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++)
      deepNoNaNOrUndefined(obj[i], `${path}[${i}]`);
    return;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj))
      deepNoNaNOrUndefined(v, `${path}.${k}`);
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

async function hard(name, fn) {
  try {
    await fn();
    console.log(`✓ HARD: ${name}`);
  } catch (e) {
    console.error(`✗ HARD: ${name}`);
    console.error(`  ${e.message}`);
    process.exitCode = 1;
  }
}

async function soft(name, fn) {
  try {
    const msg = await fn();
    if (msg) console.warn(`⚠ SOFT: ${name}\n  ${msg}`);
    else console.log(`✓ SOFT: ${name}`);
  } catch (e) {
    console.warn(`⚠ SOFT: ${name}\n  ${e.message}`);
  }
}

// ------------------------- fixtures -------------------------

// 1) Empty — true empty, no tricks
const F_EMPTY = {
  resumeText: "-",
  extractedSkills: [],
  inferredSkills: [],
};

// 2) Partial — realistic junior-ish
const F_PARTIAL = {
  resumeText:
    "Built React components using hooks like useState/useEffect. " +
    "Used async/await for API calls (fetch). " +
    "Worked with Git in team collaboration.",
  extractedSkills: asSkillObjs([
    "Hooks",
    "React State",
    "Async/Await & Promises",
    "Git & Branching",
  ]),
  inferredSkills: [],
};

// 3) Strong — make it truly strong via explicit extractedSkills (not keyword stuffing)
const F_STRONG = {
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
    // React Core
    "Hooks",
    "React State",
    "JSX",
    "Props",
    "Context API",
    "Forms & Validation",
    "Lists & Keys",
    "Conditional Rendering",
    "Lifecycle Understanding",

    // Ecosystem
    "React Router",
    "Redux/RTK",

    // JS Fundamentals / Tooling
    "Async/Await & Promises",
    "Error Handling",
    "Prototypes",
    "Closures",
    "Git & Branching",
    "Vite/Webpack Basics",
    "ESLint/Prettier",
  ]),
  inferredSkills: [],
};

// 4) Weak-signal Hooks — proven phrase should trigger Hooks as weak-signal (not explicit)
const F_HOOKS_WEAK = {
  resumeText:
    "Worked with react hooks and patterns. useEffect used for side-effects.",
  extractedSkills: asSkillObjs(["Git & Branching", "Async/Await & Promises"]),
  inferredSkills: [],
};

// 5) ATS keyword sensitivity — uses proven keyword "microtask"
const F_ATS_BASE = {
  resumeText: "react useEffect fetch promise git collaborated",
  extractedSkills: asSkillObjs(["Git & Branching", "Async/Await & Promises"]),
  inferredSkills: [],
};

// 6) Ambiguity traps (SOFT checks) — these are where brain often lies
const F_TRAP_HOOK_GENERIC = {
  resumeText:
    "Fishing hooks and hook logic in a mechanical system (not React).",
  extractedSkills: [],
  inferredSkills: [],
};

const F_TRAP_ROUTER_NETWORK = {
  resumeText:
    "Configured router, switches, NAT, routing tables for a network lab.",
  extractedSkills: [],
  inferredSkills: [],
};

// ------------------------- run -------------------------

(async function run() {
  console.log("\nBRAIN-QA: /api/analyze-resume (no OpenAI, handler-level)\n");

  // HARD 1 — Contract shape + metadata locked
  await hard("Contract shape + hardcoded metadata", async () => {
    const r = await callAnalyze(F_PARTIAL);

    assert.deepEqual(
      r.metadata,
      {
        role: "react",
        level: "junior",
        companyType: "unicorn",
        experienceYears: 0,
      },
      "metadata drift",
    );

    assert.ok(r.matches && typeof r.matches === "object", "missing matches");
    assert.ok(r.analysis && typeof r.analysis === "object", "missing analysis");

    // matches keys you proved
    assert.ok(
      Array.isArray(r.matches.matchedSkills),
      "matches.matchedSkills missing/invalid",
    );
    assert.ok(
      Array.isArray(r.matches.weakSignals),
      "matches.weakSignals missing/invalid",
    );
    assert.ok(
      Array.isArray(r.matches.missingSkills),
      "matches.missingSkills missing/invalid",
    );

    // ats shape you proved
    const ats = r.analysis.atsReadiness;
    assert.ok(ats && typeof ats === "object", "analysis.atsReadiness missing");
    for (const k of [
      "score",
      "total",
      "percentage",
      "matchedKeywords",
      "missingKeywords",
    ]) {
      assert.ok(k in ats, `atsReadiness.${k} missing`);
    }
    assert.ok(
      Array.isArray(ats.matchedKeywords),
      "atsReadiness.matchedKeywords invalid",
    );
    assert.ok(
      Array.isArray(ats.missingKeywords),
      "atsReadiness.missingKeywords invalid",
    );
  });

  // HARD 2 — No NaN / undefined anywhere
  await hard("No NaN/undefined + all numbers finite", async () => {
    const r = await callAnalyze(F_STRONG);
    deepNoNaNOrUndefined(r);
  });

  // HARD 3 — Determinism on same input
  await hard(
    "Determinism: same input twice => same finalScore + recommendations",
    async () => {
      const a = await callAnalyze(F_PARTIAL);
      const b = await callAnalyze(F_PARTIAL);
      assert.equal(
        a.analysis.finalScore,
        b.analysis.finalScore,
        "finalScore differs",
      );
      assert.deepEqual(
        a.analysis.recommendations,
        b.analysis.recommendations,
        "recommendations differ",
      );
    },
  );

  // HARD 4 — Score sanity ordering: empty < partial < strong
  await hard("Monotonic fixtures: empty < partial < strong", async () => {
    const e = await callAnalyze(F_EMPTY);
    const p = await callAnalyze(F_PARTIAL);
    const s = await callAnalyze(F_STRONG);

    const se = e.analysis.finalScore;
    const sp = p.analysis.finalScore;
    const ss = s.analysis.finalScore;

    assert(se >= 0 && se <= 5, `empty finalScore expected ~[0..5], got ${se}`);
    assert(sp > se, `partial should be > empty (${sp} <= ${se})`);
    assert(ss > sp, `strong should be > partial (${ss} <= ${sp})`);

    // strong should actually look strong
    assert(
      ss >= 70 && ss <= 95,
      `strong finalScore expected [70..95], got ${ss}`,
    );
  });

  // HARD 5 — Weak-signal Hooks behavior (proven phrase)
  await hard(
    'Weak-signal: "react hooks" => Hooks in weakSignals, not in matchedSkills',
    async () => {
      const r = await callAnalyze(F_HOOKS_WEAK);
      assert(
        !hasSkill(r.matches.matchedSkills, "Hooks"),
        "Hooks became explicit unexpectedly",
      );
      assert(
        hasSkill(r.matches.weakSignals, "Hooks"),
        "Hooks missing from weakSignals",
      );
    },
  );

  // HARD 6 — ATS sensitivity using microtask (no brittle totals)
  await hard(
    'ATS: adding "microtask" increases or preserves ATS signal',
    async () => {
      const base = await callAnalyze(F_ATS_BASE);
      const plus = await callAnalyze({
        ...F_ATS_BASE,
        resumeText: F_ATS_BASE.resumeText + " microtask",
      });

      const b = base.analysis.atsReadiness;
      const p = plus.analysis.atsReadiness;

      assert(b.total > 0 && p.total > 0, "atsReadiness.total must be > 0");
      assert(
        !b.matchedKeywords.includes("microtask"),
        "baseline already has microtask",
      );
      assert(
        p.matchedKeywords.includes("microtask"),
        "microtask not found in matchedKeywords after adding",
      );

      // allow either ratio or 0-100, but must not go down
      assert(
        p.percentage >= b.percentage,
        `ATS percentage decreased: ${b.percentage} -> ${p.percentage}`,
      );
    },
  );

  // ---------------- SOFT "brain quality" checks ----------------
  // These don't fail your run. They warn you where your dictionary/keywords are too broad.

  await soft(
    'Trap: generic "hook" text should NOT trigger React Hooks',
    async () => {
      const r = await callAnalyze(F_TRAP_HOOK_GENERIC);
      if (
        hasSkill(r.matches.weakSignals, "Hooks") ||
        hasSkill(r.matches.matchedSkills, "Hooks")
      ) {
        return `Hooks triggered by non-React context. This is a DICTIONARY problem (weak phrases too broad). Consider removing generic terms like "hook logic" from hooks.weak or requiring "react" near "hook".`;
      }
      return null;
    },
  );

  await soft(
    'Trap: networking "router" should NOT trigger React Router',
    async () => {
      const r = await callAnalyze(F_TRAP_ROUTER_NETWORK);
      if (
        hasSkill(r.matches.weakSignals, "React Router") ||
        hasSkill(r.matches.matchedSkills, "React Router")
      ) {
        return `React Router triggered by network router context. This is a KEYWORD/DISAMBIGUATION problem. "router" alone is too generic; prefer phrases like "react router", "useNavigate", "route params".`;
      }
      return null;
    },
  );

  if (!process.exitCode)
    console.log("\n✅ HARD checks PASSED. Review any SOFT warnings above.\n");
  else
    console.log(
      "\n❌ HARD checks FAILED. Fix engine/contract regressions first.\n",
    );
})();
