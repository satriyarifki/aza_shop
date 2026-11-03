import type { ApiErrorResponse, ApiFieldError } from "~/types/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH";
  body?: Record<string, unknown>;
  query?: Record<string, string | number | undefined>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: ApiFieldError[];

  constructor(status: number, message: string, fieldErrors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Sends a request to the backend API and returns the parsed JSON body.
 * Attaches the Bearer token, and turns every failure into an ApiError with a user-friendly message.
 */
export async function apiRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  const headers: Record<string, string> = {};
  if (auth.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  let response;
  try {
    response = await $fetch.raw<TResponse | ApiErrorResponse>(path, {
      baseURL: config.public.apiBase,
      method: options.method ?? "GET",
      body: options.body,
      query: options.query,
      headers,
      ignoreResponseError: true,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Please check your connection and try again.");
  }

  if (response.ok) {
    return response._data as TResponse;
  }

  const errorBody = response._data as ApiErrorResponse | undefined;

  // An expired or invalid token: forget it and send the user back to the login page
  if (response.status === 401 && auth.token) {
    auth.clearSession();
    await navigateTo("/login");
  }

  throw new ApiError(
    response.status,
    errorBody?.message ?? "Something went wrong. Please try again.",
    errorBody?.errors ?? [],
  );
}
