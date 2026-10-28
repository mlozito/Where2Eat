// The base class: every error we throw on purpose is an AppError.
export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// 400: the data that was sent is invalid
export class ValidationError extends AppError {
  constructor(message = "Invalid request", details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

// 403: you're not allowed to do this (e.g. a non-host trying to start voting)
export class ForbiddenError extends AppError {
  constructor(message = "You are not allowed to do that") {
    super(403, "FORBIDDEN", message);
  }
}

// 404: the thing you asked for doesn't exist (e.g. no group with that code)
export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, "NOT_FOUND", message);
  }
}