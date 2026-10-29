import { Prisma } from "@prisma/client";
import { z } from "zod";
import { jsonError } from "@/lib/auth/api";

/** Narrowing helper for service results that report a handled failure. */
export function isServiceError(value: object): value is { error: string } {
  return "error" in value && typeof (value as { error?: unknown }).error === "string";
}

/** Maps validation, uniqueness and relation failures to API responses. */
export function handleWriteError(error: unknown, resource: string) {
  if (error instanceof z.ZodError) {
    return jsonError(
      400,
      error.issues[0]?.message ?? "Check the submitted values.",
      error.issues,
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return jsonError(
        409,
        "A record with that unique identifier already exists in this workspace.",
      );
    }
    if (error.code === "P2003") {
      return jsonError(409, "A related record no longer exists.");
    }
    if (error.code === "P2025") {
      return jsonError(404, "Record not found in this workspace.");
    }
  }

  console.error(`Write ${resource} error:`, error);
  return jsonError(500, "Unable to save the record.");
}
