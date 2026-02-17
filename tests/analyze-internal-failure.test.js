import assert from "node:assert/strict";
import { createHandler } from "../api/analyze-resume.js";
import { MockReq, MockRes } from "./_mocks.js";

async function run() {
  console.log("=== analyze-resume internal failure test ===\n");

  let called = false;
  const handler = createHandler({
    analyzeResumeFn: async () => {
      called = true;
      return { error: "Internal analyzeResume failure", message: "boom" };
    },
  });

  const req = new MockReq("POST", {
    resumeText: "JavaScript React",
    extractedSkills: [],
    inferredSkills: [],
  });
  const res = new MockRes();

  await handler(req, res);

  assert.strictEqual(called, true, "Stub should be called");
  assert.strictEqual(res.statusCode, 500, "Status should be 500");
  assert(res.jsonData && typeof res.jsonData === "object", "JSON required");
  assert.deepEqual(Object.keys(res.jsonData), ["error"]);

  const err = res.jsonData.error;
  assert(err && typeof err === "object", "error object required");
  assert.deepEqual(
    Object.keys(err).sort(),
    ["code", "details", "message"].sort(),
  );
  assert.strictEqual(err.code, "INTERNAL_ERROR");
  assert.strictEqual(typeof err.message, "string");
  assert(err.details && typeof err.details === "object");
  assert.strictEqual(err.details.message, "boom");

  console.log("✅ PASS: INTERNAL_ERROR returned for internal failure\n");
}

run().catch((err) => {
  console.error("❌ FAIL:", err.message);
  process.exit(1);
});
