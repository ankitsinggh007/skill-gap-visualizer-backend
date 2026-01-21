// lib/http/error.js

/**
 * Standard error response wrapper
 * Returns: { error: { code, message, details } }
 */
export function createErrorResponse(code, message, details = {}) {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Standard HTTP error codes and status codes
 */
export const HTTP_ERRORS = {
  BAD_REQUEST: {
    code: "BAD_REQUEST",
    status: 400,
  },
  METHOD_NOT_ALLOWED: {
    code: "METHOD_NOT_ALLOWED",
    status: 405,
  },
  INTERNAL_ERROR: {
    code: "INTERNAL_ERROR",
    status: 500,
  },
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    status: 400,
  },
  MISSING_FIELD: {
    code: "MISSING_FIELD",
    status: 400,
  },
};

/**
 * Send standardized error response
 */
export function sendError(res, errorType, message, details = {}) {
  const { code, status } = errorType;
  const errorResponse = createErrorResponse(code, message, details);
  return res.status(status).json(errorResponse);
}
