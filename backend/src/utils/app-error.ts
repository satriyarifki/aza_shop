import type { ContentfulStatusCode } from "hono/utils/http-status";

export type FieldError = {
  field: string;
  message: string;
};

export class AppError extends Error {
  readonly statusCode: ContentfulStatusCode;
  readonly errors?: FieldError[];

  constructor(statusCode: ContentfulStatusCode, message: string, errors?: FieldError[]) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
