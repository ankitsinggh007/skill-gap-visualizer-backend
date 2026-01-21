/**
 * Mock request/response helpers for API testing
 * Used by contract smoke tests
 */

export class MockReq {
  constructor(method = "POST", body = {}) {
    this.method = method;
    this.body = body;
  }
}

export class MockRes {
  constructor() {
    this.statusCode = null;
    this.jsonData = null;
    this.headers = {};
    this.headersSent = false;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(data) {
    this.jsonData = data;
    this.headersSent = true;
    return this;
  }

  setHeader(key, value) {
    this.headers[key] = value;
  }

  getHeader(key) {
    return this.headers[key];
  }
}
