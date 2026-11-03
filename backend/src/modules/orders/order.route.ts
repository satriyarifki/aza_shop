import { Hono } from "hono";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { sendSuccess } from "../../utils/response.js";
import { createOrderSchema } from "./order.schema.js";
import * as orderService from "./order.service.js";

type OrderDetail = Awaited<ReturnType<typeof orderService.getOrderById>>;

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

orderRoutes.post("/", validate("json", createOrderSchema), async (c) => {
  const order = await orderService.createOrder(c.req.valid("json"), c.get("user").id);

  return sendSuccess(c, "Order created successfully", toOrderDetailResponse(order), 201);
});
