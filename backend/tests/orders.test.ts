import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, pool } from "../src/db/index.js";
import { orders, products } from "../src/db/schema/index.js";
import { calculateDiscount } from "../src/modules/orders/order.discount.js";
import { toBusinessDate } from "../src/utils/date.js";
import { api, getStock, loginAsAdmin, resetDatabase } from "./helpers.js";

type Fixtures = Awaited<ReturnType<typeof resetDatabase>>;

let fixtures: Fixtures;
let authorization: string;

beforeEach(async () => {
  fixtures = await resetDatabase();
  authorization = await loginAsAdmin();
});

afterAll(async () => {
  await pool.end();
});

function createOrder(items: { product_id: number; quantity: number }[]) {
  return api
    .post("/api/orders")
    .set("Authorization", authorization)
    .send({ customer_id: fixtures.customer.id, items });
}

function changeStatus(orderId: number, action: "pay" | "cancel") {
  return api.patch(`/api/orders/${orderId}/${action}`).set("Authorization", authorization);
}

async function countOrders() {
  const [result] = await db.select({ total: sql<number>`count(*)::int` }).from(orders);
  return result!.total;
}

describe("calculateDiscount (Variant A)", () => {
  it.each([
    { subtotal: 0n, discount: 0n },
    { subtotal: 499_999n, discount: 0n },
    { subtotal: 500_000n, discount: 25_000n },
    { subtotal: 999_999n, discount: 49_999n }, // 49,999.95 is truncated
    { subtotal: 1_000_000n, discount: 100_000n },
    { subtotal: 1_500_000n, discount: 150_000n },
    { subtotal: 5_000_000n, discount: 150_000n }, // capped
  ])("subtotal $subtotal gets discount $discount", ({ subtotal, discount }) => {
    expect(calculateDiscount(subtotal)).toEqual({ discountAmount: discount, grandTotal: subtotal - discount });
  });
});

describe("POST /api/orders", () => {
  it("creates an order with backend-calculated totals and deducts stock", async () => {
    const response = await createOrder([
      { product_id: fixtures.keyboard.id, quantity: 1 },
      { product_id: fixtures.mouse.id, quantity: 2 },
    ]);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      status: "PENDING",
      subtotal: "1120000",
      discount_amount: "112000",
      grand_total: "1008000",
      customer: { id: fixtures.customer.id },
    });
    expect(response.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ product_id: fixtures.keyboard.id, quantity: 1, unit_price: "750000", subtotal: "750000" }),
        expect.objectContaining({ product_id: fixtures.mouse.id, quantity: 2, unit_price: "185000", subtotal: "370000" }),
      ]),
    );

    const today = toBusinessDate(new Date()).replaceAll("-", "");
    expect(response.body.data.order_number).toBe(`INV-${today}-0001`);

    expect(await getStock(fixtures.keyboard.id)).toBe(9);
    expect(await getStock(fixtures.mouse.id)).toBe(18);
  });

  it("rejects an order with insufficient stock without changing any stock", async () => {
    const response = await createOrder([
      { product_id: fixtures.mouse.id, quantity: 1 },
      { product_id: fixtures.cable.id, quantity: 5 },
    ]);

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual([
      { field: "items.1.quantity", message: "Insufficient stock for CBL-001 (available: 2)" },
    ]);
    expect(await getStock(fixtures.mouse.id)).toBe(20);
    expect(await getStock(fixtures.cable.id)).toBe(2);
    expect(await countOrders()).toBe(0);
  });

  it("ignores client-sent prices and rejects duplicate products", async () => {
    const withPrice = await api
      .post("/api/orders")
      .set("Authorization", authorization)
      .send({ customer_id: fixtures.customer.id, items: [{ product_id: fixtures.keyboard.id, quantity: 1, unit_price: "1" }] });
    const duplicated = await createOrder([
      { product_id: fixtures.keyboard.id, quantity: 1 },
      { product_id: fixtures.keyboard.id, quantity: 1 },
    ]);

    expect(withPrice.status).toBe(400);
    expect(duplicated.status).toBe(400);
  });

  it("keeps the price snapshot when the product price changes later", async () => {
    const created = await createOrder([{ product_id: fixtures.keyboard.id, quantity: 1 }]);

    await db.update(products).set({ price: 999_000n }).where(eq(products.id, fixtures.keyboard.id));
    const detail = await api.get(`/api/orders/${created.body.data.id}`).set("Authorization", authorization);

    expect(detail.body.data.items[0].unit_price).toBe("750000");
    expect(detail.body.data.grand_total).toBe("712500");
  });

  it("never oversells when orders arrive at the same time", async () => {
    // The cable has 2 units in stock
    const responses = await Promise.all(
      Array.from({ length: 6 }, () => createOrder([{ product_id: fixtures.cable.id, quantity: 1 }])),
    );
    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([201, 201, 422, 422, 422, 422]);
    expect(await getStock(fixtures.cable.id)).toBe(0);
  });
});

describe("order status transitions", () => {
  it("restores stock when an order is cancelled", async () => {
    const created = await createOrder([{ product_id: fixtures.mouse.id, quantity: 3 }]);
    expect(await getStock(fixtures.mouse.id)).toBe(17);

    const response = await changeStatus(created.body.data.id, "cancel");

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("CANCELLED");
    expect(await getStock(fixtures.mouse.id)).toBe(20);
  });

  it("restores stock when a paid order is cancelled", async () => {
    const created = await createOrder([{ product_id: fixtures.mouse.id, quantity: 3 }]);

    expect((await changeStatus(created.body.data.id, "pay")).body.data.status).toBe("PAID");
    expect((await changeStatus(created.body.data.id, "cancel")).status).toBe(200);
    expect(await getStock(fixtures.mouse.id)).toBe(20);
  });

  it("returns 409 for invalid status transitions", async () => {
    const created = await createOrder([{ product_id: fixtures.mouse.id, quantity: 1 }]);
    const orderId = created.body.data.id;

    await changeStatus(orderId, "pay");
    const payTwice = await changeStatus(orderId, "pay");

    await changeStatus(orderId, "cancel");
    const payCancelled = await changeStatus(orderId, "pay");

    expect(payTwice.status).toBe(409);
    expect(payCancelled.status).toBe(409);
  });

  it("does not restore stock twice when cancelled repeatedly or concurrently", async () => {
    const created = await createOrder([{ product_id: fixtures.mouse.id, quantity: 4 }]);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => changeStatus(created.body.data.id, "cancel")),
    );
    const repeated = await changeStatus(created.body.data.id, "cancel");

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409, 409, 409, 409]);
    expect(repeated.status).toBe(409);
    expect(await getStock(fixtures.mouse.id)).toBe(20);
  });

  it("returns 404 for an unknown order", async () => {
    expect((await changeStatus(999_999, "pay")).status).toBe(404);
  });
});

describe("GET /api/orders", () => {
  it("filters by status and Asia/Jakarta calendar date", async () => {
    const first = await createOrder([{ product_id: fixtures.mouse.id, quantity: 1 }]);
    const second = await createOrder([{ product_id: fixtures.mouse.id, quantity: 1 }]);
    await changeStatus(second.body.data.id, "pay");

    // 2026-11-02T17:00:00Z is 2026-11-03 00:00 in Jakarta; 16:59:59Z is still 2026-11-02
    await db.update(orders).set({ createdAt: new Date("2026-11-02T17:00:00Z") }).where(eq(orders.id, first.body.data.id));
    await db.update(orders).set({ createdAt: new Date("2026-11-02T16:59:59Z") }).where(eq(orders.id, second.body.data.id));

    const onNovember3 = await api
      .get("/api/orders?start_date=2026-11-03&end_date=2026-11-03")
      .set("Authorization", authorization);
    const paid = await api.get("/api/orders?status=PAID").set("Authorization", authorization);

    expect(onNovember3.body.data.map((order: { id: number }) => order.id)).toEqual([first.body.data.id]);
    expect(paid.body.data.map((order: { id: number }) => order.id)).toEqual([second.body.data.id]);
  });

  it("rejects a start date after the end date", async () => {
    const response = await api
      .get("/api/orders?start_date=2026-11-04&end_date=2026-11-03")
      .set("Authorization", authorization);

    expect(response.status).toBe(400);
  });
});
