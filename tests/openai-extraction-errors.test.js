#!/usr/bin/env node
import assert from "node:assert/strict";
import { classifyOpenAIError } from "../lib/extraction/openai/classifyOpenAIError.js";
import { createOpenAIExtractionRunner } from "../lib/extraction/openai/runOpenAIExtraction.js";
import { EMPTY_EXTRACTION_SCHEMA } from "../lib/extraction/extractionSchema.js";

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

function makeError({ status, code, type, message }) {
  const err = new Error(message || "error");
  if (status) err.status = status;
  if (code) err.code = code;
  if (type) err.type = type;
  return err;
}

function makeRunner({ behavior, maxRetries = 1 }) {
  let callCount = 0;
  const callOpenAIOnce = async () => {
    callCount++;
    if (behavior.type === "throw") {
      throw behavior.error;
    }
    return {
      result: behavior.result || { ...EMPTY_EXTRACTION_SCHEMA },
      parseError: Boolean(behavior.parseError),
    };
  };

  const run = createOpenAIExtractionRunner({
    callOpenAIOnce,
    maxRetries,
    backoffMs: 0,
    sleepFn: async () => {},
  });

  return { run, getCallCount: () => callCount };
}

console.log("\nOPENAI ERROR CLASSIFICATION TESTS\n");

test("Auth error -> action=throw", () => {
  const err = makeError({ status: 401 });
  const res = classifyOpenAIError(err);
  assert.equal(res.category, "auth");
  assert.equal(res.action, "throw");
});

test("Invalid request -> action=throw", () => {
  const err = makeError({ status: 400 });
  const res = classifyOpenAIError(err);
  assert.equal(res.category, "invalid_request");
  assert.equal(res.action, "throw");
});

test("Rate limit -> action=fallback", () => {
  const err = makeError({ status: 429 });
  const res = classifyOpenAIError(err);
  assert.equal(res.category, "rate_limit");
  assert.equal(res.action, "fallback");
});

test("Safety -> action=fallback", () => {
  const err = makeError({ code: "content_policy_violation" });
  const res = classifyOpenAIError(err);
  assert.equal(res.category, "safety");
  assert.equal(res.action, "fallback");
});

test("Transient -> action=retry", () => {
  const err = makeError({ status: 502 });
  const res = classifyOpenAIError(err);
  assert.equal(res.category, "transient");
  assert.equal(res.action, "retry");
});

console.log("\nOPENAI RUNNER BEHAVIOR TESTS\n");

await asyncTest("Success -> extractionSource=openai", async () => {
  const { run } = makeRunner({
    behavior: {
      type: "return",
      result: {
        ...EMPTY_EXTRACTION_SCHEMA,
        extractedSkills: [{ skill: "react" }],
      },
    },
  });
  const result = await run("resume text");
  assert.equal(result.extractionSource, "openai");
});

await asyncTest("Parse error -> fallback", async () => {
  const { run } = makeRunner({
    behavior: {
      type: "return",
      parseError: true,
    },
  });
  const result = await run("resume text");
  assert.equal(result.extractionSource, "fallback");
});

await asyncTest("Transient error retries then fallback", async () => {
  const { run, getCallCount } = makeRunner({
    behavior: { type: "throw", error: makeError({ status: 503 }) },
    maxRetries: 1,
  });
  const result = await run("resume text");
  assert.equal(result.extractionSource, "fallback");
  assert.equal(getCallCount(), 2);
});

await asyncTest("Rate limit -> immediate fallback", async () => {
  const { run, getCallCount } = makeRunner({
    behavior: { type: "throw", error: makeError({ status: 429 }) },
    maxRetries: 3,
  });
  const result = await run("resume text");
  assert.equal(result.extractionSource, "fallback");
  assert.equal(getCallCount(), 1);
});

await asyncTest("Auth error -> throws", async () => {
  const { run } = makeRunner({
    behavior: { type: "throw", error: makeError({ status: 401 }) },
  });
  let threw = false;
  try {
    await run("resume text");
  } catch {
    threw = true;
  }
  assert.equal(threw, true);
});

await asyncTest("Invalid request -> throws", async () => {
  const { run } = makeRunner({
    behavior: { type: "throw", error: makeError({ status: 400 }) },
  });
  let threw = false;
  try {
    await run("resume text");
  } catch {
    threw = true;
  }
  assert.equal(threw, true);
});

console.log(`\nResults: ${testsRun - testsFailed} passed, ${testsFailed} failed`);
process.exit(testsFailed > 0 ? 1 : 0);
