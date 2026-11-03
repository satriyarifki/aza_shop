import type { z } from "zod";
import type { ApiFieldError } from "~/types/api";

export type FieldErrors = Record<string, string>;

type ValidationResult<T> = { data: T; errors: null } | { data: null; errors: FieldErrors };

// Runs a Zod schema and returns the first message for each invalid field
export function validateForm<Schema extends z.ZodType>(
  schema: Schema,
  values: unknown,
): ValidationResult<z.infer<Schema>> {
  const result = schema.safeParse(values);

  if (result.success) {
    return { data: result.data, errors: null };
  }

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join(".");
    errors[field] ??= issue.message;
  }

  return { data: null, errors };
}

// Converts the backend's field errors into the same shape used by validateForm
export function toFieldErrors(apiErrors: ApiFieldError[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const error of apiErrors) {
    errors[error.field] ??= error.message;
  }
  return errors;
}
