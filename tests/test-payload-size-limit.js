#!/usr/bin/env node
import extractHandler from "../api/extract.js";
import analyzeHandler from "../api/analyze-resume.js";

const MAX = 100_000;

class MockRes {
  constructor() {
    this.statusCode = null;
    this.jsonData = null;
    this.headers = {};
  }
  setHeader(k, v) {
    this.headers[k] = v;
  }
  status(code) {
    this.statusCode = code;
    return this;
  }
  json(data) {
    this.jsonData = data;
    return this;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function testOversize(handler, name) {
  const req = {
    method: "POST",
    body: { resumeText: "x".repeat(MAX + 1) },
  };
  const res = new MockRes();

  await handler(req, res);

  assert(
    res.statusCode === 413,
    `${name}: expected 413, got ${res.statusCode}`,
  );
  assert(
    res.jsonData?.error?.code === "PAYLOAD_TOO_LARGE",
    `${name}: expected PAYLOAD_TOO_LARGE`,
  );
  assert(
    res.jsonData?.error?.details?.maxChars === MAX,
    `${name}: expected maxChars=${MAX}`,
  );
  console.log(`✅ ${name}: oversize -> 413 PAYLOAD_TOO_LARGE`);
}

(async function run() {
  await testOversize(extractHandler, "POST /api/extract");
  await testOversize(analyzeHandler, "POST /api/analyze-resume");
  console.log("\n✅ Payload limit handler tests passed");
})().catch((e) => {
  console.error("❌ Test failed:", e.message);
  process.exit(1);
});
