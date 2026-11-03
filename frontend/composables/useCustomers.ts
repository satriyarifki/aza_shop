import type { CustomerInput } from "~/schemas/customer";
import type { ApiPaginatedResponse, ApiSuccessResponse } from "~/types/api";
import type { Customer } from "~/types/customer";

type ListCustomersParams = {
  page: number;
  limit: number;
  search?: string;
};

export function useCustomers() {
  function listCustomers({ page, limit, search }: ListCustomersParams) {
    return apiRequest<ApiPaginatedResponse<Customer>>("/customers", {
      query: { page, limit, search: search || undefined },
    });
  }

  function createCustomer(input: CustomerInput) {
    return apiRequest<ApiSuccessResponse<Customer>>("/customers", { method: "POST", body: input });
  }

  return { listCustomers, createCustomer };
}
