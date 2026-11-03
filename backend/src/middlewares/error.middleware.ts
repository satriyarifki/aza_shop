import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import pg from "pg";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";
import { sendError } from "../utils/response.js";

const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";
const PG_CHECK_VIOLATION = "23514";

const uniqueConstraintMessages: Record<string, string> = {
  products_product_code_unique: "Product code already exists",
  users_email_unique: "Email already exists",
};

// Drizzle wraps driver errors, so the original PostgreSQL error is in `cause`
function findDatabaseError(error: unknown) {
  if (error instanceof pg.DatabaseError) {
    return error;
  }
  if (error instanceof Error && error.cause instanceof pg.DatabaseError) {
    return error.cause;
  }
  return null;
}

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof AppError) {
    return sendError(c, error.statusCode, error.message, error.errors);
  }

  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return sendError(c, 400, "Validation failed", errors);
  }

  if (error instanceof HTTPException) {
    return sendError(c, error.status, error.message);
  }

  const databaseError = findDatabaseError(error);

  if (databaseError?.code === PG_UNIQUE_VIOLATION) {
    const message = uniqueConstraintMessages[databaseError.constraint ?? ""] ?? "Data already exists";
    return sendError(c, 409, message);
  }

  if (databaseError?.code === PG_FOREIGN_KEY_VIOLATION) {
    return sendError(c, 409, "Related data does not exist or is still in use");
  }

  if (databaseError?.code === PG_CHECK_VIOLATION) {
    return sendError(c, 422, "Data violates a business rule");
  }

  console.error(error);
  return sendError(c, 500, "Internal server error");
};

export const notFoundHandler: NotFoundHandler = (c) => {
  return sendError(c, 404, "Route not found");
};
