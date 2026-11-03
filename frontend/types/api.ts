// Response shapes shared by every backend endpoint

export type ApiFieldError = {
  field: string;
  message: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiPaginatedResponse<T> = ApiSuccessResponse<T[]> & {
  pagination: Pagination;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: ApiFieldError[];
};
