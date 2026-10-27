import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Stable API error codes. Never leak internals. */
export type ApiErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal_error";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }

  static validation(message: string, details?: unknown) {
    return new ApiError(400, "validation_error", message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "unauthorized", message);
  }
  static forbidden(message = "Insufficient permissions") {
    return new ApiError(403, "forbidden", message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, "not_found", message);
  }
  static conflict(message: string) {
    return new ApiError(409, "conflict", message);
  }
  static rateLimited(message = "Too many requests") {
    return new ApiError(429, "rate_limited", message);
  }
  static internal(message = "An unexpected error occurred") {
    return new ApiError(500, "internal_error", message);
  }
}

export function jsonError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Request validation failed",
          details: error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
      },
      { status: 400 },
    );
  }
  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: { code: "internal_error", message: "An unexpected error occurred" } },
    { status: 500 },
  );
}
