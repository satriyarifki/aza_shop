import type { ProductInput } from "~/schemas/product";
import type { ApiPaginatedResponse, ApiSuccessResponse } from "~/types/api";
import type { Product } from "~/types/product";

type ListProductsParams = {
  page: number;
  limit: number;
  search?: string;
};

export function useProducts() {
  function listProducts({ page, limit, search }: ListProductsParams) {
    return apiRequest<ApiPaginatedResponse<Product>>("/products", {
      query: { page, limit, search: search || undefined },
    });
  }

  function createProduct(input: ProductInput) {
    return apiRequest<ApiSuccessResponse<Product>>("/products", { method: "POST", body: input });
  }

  function updateProduct(id: number, input: ProductInput) {
    return apiRequest<ApiSuccessResponse<Product>>(`/products/${id}`, { method: "PUT", body: input });
  }

  return { listProducts, createProduct, updateProduct };
}
