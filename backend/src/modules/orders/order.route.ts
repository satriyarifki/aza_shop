import { Hono } from "hono";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { sendPaginated, sendSuccess } from "../../utils/response.js";
import { createOrderSchema, listOrdersQuerySchema, orderIdParamSchema } from "./order.schema.js";
import * as orderService from "./order.service.js";

type OrderSummary = Awaited<ReturnType<typeof orderService.listOrders>>["items"][number];
type OrderDetail = Awaited<ReturnType<typeof orderService.getOrderById>>;

function toOrderSummaryResponse(order: OrderSummary) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal.toString(),
    discount_amount: order.discountAmount.toString(),
    grand_total: order.grandTotal.toString(),
    customer: {
      id: order.customer.id,
      name: order.customer.name,
    },
    created_at: order.createdAt.toISOString(),
    updated_at: order.updatedAt.toISOString(),
  };
}

function toOrderDetailResponse(order: OrderDetail) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal.toString(),
    discount_amount: order.discountAmount.toString(),
    grand_total: order.grandTotal.toString(),
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      address: order.customer.address,
    },
    created_by: {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
    },
    items: order.items.map((item) => ({
      id: item.id,
      product_id: item.productId,
      product_code: item.product.productCode,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.unitPrice.toString(),
      subtotal: item.subtotal.toString(),
    })),
    created_at: order.createdAt.toISOString(),
    updated_at: order.updatedAt.toISOString(),
  };
}

export const orderRoutes = new Hono();

orderRoutes.use("*", requireAuth);

orderRoutes.get("/", validate("query", listOrdersQuerySchema), async (c) => {
  const query = c.req.valid("query");
  const { items, total } = await orderService.listOrders(query);

  return sendPaginated(c, "Orders retrieved successfully", items.map(toOrderSummaryResponse), {
    page: query.page,
    limit: query.limit,
    total,
  });
});

orderRoutes.get("/:id", validate("param", orderIdParamSchema), async (c) => {
  const order = await orderService.getOrderById(c.req.valid("param").id);

  return sendSuccess(c, "Order retrieved successfully", toOrderDetailResponse(order));
});

orderRoutes.post("/", validate("json", createOrderSchema), async (c) => {
  const order = await orderService.createOrder(c.req.valid("json"), c.get("user").id);

  return sendSuccess(c, "Order created successfully", toOrderDetailResponse(order), 201);
});

orderRoutes.patch("/:id/pay", validate("param", orderIdParamSchema), async (c) => {
  const order = await orderService.payOrder(c.req.valid("param").id);

  return sendSuccess(c, "Order paid successfully", toOrderDetailResponse(order));
});

orderRoutes.patch("/:id/cancel", validate("param", orderIdParamSchema), async (c) => {
  const order = await orderService.cancelOrder(c.req.valid("param").id);

  return sendSuccess(c, "Order cancelled successfully", toOrderDetailResponse(order));
});
