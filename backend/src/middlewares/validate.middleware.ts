import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";

// Throw validation errors so they reach the central error handler and share its response format
export function validate<Schema extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: Schema,
) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      throw result.error;
    }
  });
}
