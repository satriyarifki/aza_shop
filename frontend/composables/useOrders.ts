import type { OrderInput } from "~/schemas/order";
import type { ApiPaginatedResponse, ApiSuccessResponse } from "~/types/api";
import type { OrderDetail, OrderStatus, OrderSummary } from "~/types/order";

export type OrderFilters = {
  page: number;
  limit: number;
  status?: OrderStatus;
  start_date?: string;
  end_date?: string;
};

export function useOrders() {
  function listOrders(filters: OrderFilters) {
    return apiRequest<ApiPaginatedResponse<OrderSummary>>("/orders", { query: filters });
  }

  function getOrder(id: number) {
    return apiRequest<ApiSuccessResponse<OrderDetail>>(`/orders/${id}`);
  }

  function createOrder(input: OrderInput) {
    return apiRequest<ApiSuccessResponse<OrderDetail>>("/orders", { method: "POST", body: input });
  }

  function payOrder(id: number) {
    return apiRequest<ApiSuccessResponse<OrderDetail>>(`/orders/${id}/pay`, { method: "PATCH" });
  }

  function cancelOrder(id: number) {
    return apiRequest<ApiSuccessResponse<OrderDetail>>(`/orders/${id}/cancel`, { method: "PATCH" });
  }

  return { listOrders, getOrder, createOrder, payOrder, cancelOrder };
}
