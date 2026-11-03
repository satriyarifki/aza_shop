import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { FieldError } from "./app-error.js";

type PaginationInput = {
  page: number;
  limit: number;
  total: number;
};

export function sendSuccess<T>(
  c: Context,
  message: string,
  data: T,
  status: ContentfulStatusCode = 200,
) {
  return c.json({ success: true, message, data }, status);
}

export function sendPaginated<T>(c: Context, message: string, data: T[], pagination: PaginationInput) {
  return c.json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      total_pages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

export function sendError(
  c: Context,
  status: ContentfulStatusCode,
  message: string,
  errors?: FieldError[],
) {
  return c.json({ success: false, message, ...(errors && { errors }) }, status);
}
