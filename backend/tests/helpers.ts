import { getRequestListener } from "@hono/node-server";
import { eq, sql } from "drizzle-orm";
import supertest from "supertest";
import { app } from "../src/app.js";
import { db } from "../src/db/index.js";
import { customers, products, users } from "../src/db/schema/index.js";
import { hashPassword } from "../src/utils/password.js";

// Supertest wraps this listener in one HTTP server that it starts on demand and closes once no request is
// pending. Finish one request (e.g. login) before creating the next, or the next request loses its server.
export const api = supertest(getRequestListener(app.fetch));

export const ADMIN_EMAIL = "admin@example.com";
export const ADMIN_PASSWORD = "admin123";

// Empties every table and inserts a small, known data set
export async function resetDatabase() {
  await db.execute(
    sql`TRUNCATE TABLE order_items, orders, invoice_sequences, products, customers, users RESTART IDENTITY CASCADE`,
  );

  const [admin] = await db
    .insert(users)
    .values({ name: "Administrator", email: ADMIN_EMAIL, password: await hashPassword(ADMIN_PASSWORD) })
    .returning();

  const insertedProducts = await db
    .insert(products)
    .values([
      { productCode: "KBD-001", name: "Mechanical Keyboard", price: 750_000n, stock: 10 },
      { productCode: "MOU-001", name: "Wireless Mouse", price: 185_000n, stock: 20 },
      { productCode: "CBL-001", name: "HDMI Cable", price: 50_000n, stock: 2 },
    ])
    .returning();

  const [customer] = await db
    .insert(customers)
    .values({ name: "Budi Santoso", email: "budi@example.com", phone: "081234567890" })
    .returning();

  const productByCode = (code: string) => insertedProducts.find((product) => product.productCode === code)!;

  return {
    admin: admin!,
    customer: customer!,
    keyboard: productByCode("KBD-001"),
    mouse: productByCode("MOU-001"),
    cable: productByCode("CBL-001"),
  };
}

export async function loginAsAdmin() {
  const response = await api.post("/api/auth/login").send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return `Bearer ${response.body.data.access_token as string}`;
}

export async function getStock(productId: number) {
  const [product] = await db.select({ stock: products.stock }).from(products).where(eq(products.id, productId));
  return product!.stock;
}
