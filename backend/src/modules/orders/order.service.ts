import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, type Transaction } from "../../db/index.js";
import { customers, orderItems, orders, products } from "../../db/schema/index.js";
import { AppError, type FieldError } from "../../utils/app-error.js";
import { generateOrderNumber } from "../../utils/order-number.js";
import { calculateDiscount } from "./order.discount.js";
import type { CreateOrderInput } from "./order.schema.js";
import { allowedStatusTransitions, type OrderStatus } from "./order.types.js";

export async function getOrderById(id: number) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      customer: true,
      user: { columns: { id: true, name: true, email: true } },
      items: {
        with: { product: { columns: { productCode: true, name: true } } },
        orderBy: asc(orderItems.id),
      },
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  return order;
}

export async function createOrder(input: CreateOrderInput, userId: number) {
  const orderId = await db.transaction(async (tx) => {
    const [customer] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, input.customer_id));

    if (!customer) {
      throw new AppError(422, "Customer not found", [
        { field: "customer_id", message: "Customer not found" },
      ]);
    }

    // Lock the product rows in ascending ID order so concurrent orders for the same
    // products wait for each other instead of deadlocking or overselling.
    const productIds = input.items.map((item) => item.product_id);
    const lockedProducts = await tx
      .select()
      .from(products)
      .where(inArray(products.id, productIds))
      .orderBy(asc(products.id))
      .for("update");

    const productsById = new Map(lockedProducts.map((product) => [product.id, product]));
    const itemErrors: FieldError[] = [];

    input.items.forEach((item, index) => {
      const product = productsById.get(item.product_id);

      if (!product) {
        itemErrors.push({ field: `items.${index}.product_id`, message: "Product not found" });
      } else if (product.stock < item.quantity) {
        itemErrors.push({
          field: `items.${index}.quantity`,
          message: `Insufficient stock for ${product.productCode} (available: ${product.stock})`,
        });
      }
    });

    if (itemErrors.length > 0) {
      throw new AppError(422, "Order cannot be created", itemErrors);
    }

    // Prices come from the locked product rows, never from the client
    const lines = input.items.map((item) => {
      const product = productsById.get(item.product_id)!;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: product.price * BigInt(item.quantity),
      };
    });

    const subtotal = lines.reduce((total, line) => total + line.subtotal, 0n);
    const { discountAmount, grandTotal } = calculateDiscount(subtotal);

    const createdAt = new Date();
    const orderNumber = await generateOrderNumber(tx, createdAt);

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        customerId: customer.id,
        userId,
        subtotal,
        discountAmount,
        grandTotal,
        createdAt,
        updatedAt: createdAt,
      })
      .returning({ id: orders.id });

    await tx.insert(orderItems).values(lines.map((line) => ({ ...line, orderId: order!.id })));

    for (const line of lines) {
      // The stock condition is a second guard on top of the row lock
      const updated = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${line.quantity}` })
        .where(and(eq(products.id, line.productId), gte(products.stock, line.quantity)))
        .returning({ id: products.id });

      if (updated.length === 0) {
        throw new AppError(409, "Stock changed while creating the order, please try again");
      }
    }

    return order!.id;
  });

  return getOrderById(orderId);
}

// Locking the order row makes concurrent pay/cancel requests for the same order run one at a time,
// so each one sees the status left by the previous request.
async function lockOrderForStatusChange(tx: Transaction, id: number, nextStatus: OrderStatus) {
  const [order] = await tx
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.id, id))
    .for("update");

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  if (order.status === nextStatus) {
    throw new AppError(409, `Order is already ${nextStatus.toLowerCase()}`);
  }

  if (!allowedStatusTransitions[order.status].includes(nextStatus)) {
    throw new AppError(409, `Cannot change order status from ${order.status} to ${nextStatus}`);
  }

  return order;
}

export async function payOrder(id: number) {
  await db.transaction(async (tx) => {
    await lockOrderForStatusChange(tx, id, "PAID");
    await tx.update(orders).set({ status: "PAID" }).where(eq(orders.id, id));
  });

  return getOrderById(id);
}

export async function cancelOrder(id: number) {
  await db.transaction(async (tx) => {
    await lockOrderForStatusChange(tx, id, "CANCELLED");
    await tx.update(orders).set({ status: "CANCELLED" }).where(eq(orders.id, id));

    const items = await tx
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    // Same ascending lock order as order creation, to avoid deadlocks between the two
    await tx
      .select({ id: products.id })
      .from(products)
      .where(inArray(products.id, items.map((item) => item.productId)))
      .orderBy(asc(products.id))
      .for("update");

    for (const item of items) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }
  });

  return getOrderById(id);
}
