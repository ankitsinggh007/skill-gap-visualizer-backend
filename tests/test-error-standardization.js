import {
  HTTP_ERRORS,
  createErrorResponse,
  sendError,
} from "../lib/http/error.js";

console.log("=== Error Standardization Test ===\n");

// Test 1: createErrorResponse function
console.log("Test 1: createErrorResponse");
const errorResponse = createErrorResponse(
  "BAD_REQUEST",
  "Missing required field",
  { field: "resumeText" },
);
console.log(JSON.stringify(errorResponse, null, 2));

// Verify structure
if (
  errorResponse.error &&
  errorResponse.error.code === "BAD_REQUEST" &&
  errorResponse.error.message === "Missing required field" &&
  errorResponse.error.details.field === "resumeText"
) {
  console.log("✅ PASS: Error response structure correct\n");
} else {
  console.log("❌ FAIL: Error response structure incorrect\n");
}

// Test 2: HTTP_ERRORS constant
console.log("Test 2: HTTP_ERRORS constant");
console.log("Available error types:");
Object.entries(HTTP_ERRORS).forEach(([type, config]) => {
  console.log(`  - ${type}: code="${config.code}", status=${config.status}`);
});

// Verify all error types have code and status
const allValid = Object.values(HTTP_ERRORS).every(
  (config) => config.code && config.status,
);
if (allValid) {
  console.log("✅ PASS: All error types properly configured\n");
} else {
  console.log("❌ FAIL: Some error types missing code or status\n");
}

// Test 3: Mock sendError response
console.log("Test 3: Mock sendError behavior");

class MockRes {
  constructor() {
    this.statusCode = null;
    this.jsonData = null;
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

const mockRes = new MockRes();
sendError(mockRes, HTTP_ERRORS.VALIDATION_ERROR, "Invalid input format", {
  field: "resumeText",
  received: "object",
});

console.log("Status Code:", mockRes.statusCode);
console.log("Response Body:", JSON.stringify(mockRes.jsonData, null, 2));

// Verify sendError response
if (
  mockRes.statusCode === 400 &&
  mockRes.jsonData.error &&
  mockRes.jsonData.error.code === "VALIDATION_ERROR" &&
  mockRes.jsonData.error.message === "Invalid input format" &&
  mockRes.jsonData.error.details.field === "resumeText"
) {
  console.log("✅ PASS: sendError generates correct response\n");
} else {
  console.log("❌ FAIL: sendError response incorrect\n");
}

// Test 4: All error codes
console.log("Test 4: All error type codes");
const errorCodes = {
  METHOD_NOT_ALLOWED: 405,
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400,
  MISSING_FIELD: 400,
  INTERNAL_ERROR: 500,
};

Object.entries(errorCodes).forEach(([errorType, expectedStatus]) => {
  const status = HTTP_ERRORS[errorType]?.status;
  if (status === expectedStatus) {
    console.log(`  ✅ ${errorType}: ${status}`);
  } else {
    console.log(`  ❌ ${errorType}: expected ${expectedStatus}, got ${status}`);
  }
});

console.log("\n=== All Tests Completed ===");
