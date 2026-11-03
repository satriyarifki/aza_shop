import type { orderStatusEnum } from "../../db/schema/index.js";

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

// Every status an order is allowed to move to from its current status
export const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["CANCELLED"],
  CANCELLED: [],
};
