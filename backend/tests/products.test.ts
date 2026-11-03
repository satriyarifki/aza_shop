import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../src/db/index.js";
import { api, loginAsAdmin, resetDatabase } from "./helpers.js";

let authorization: string;

beforeEach(async () => {
  await resetDatabase();
  authorization = await loginAsAdmin();
});

afterAll(async () => {
  await pool.end();
});

const newProduct = { product_code: "SSD-001", name: "External SSD 1TB", price: "1299000", stock: 15 };

describe("POST /api/products", () => {
  it("creates a product and returns the price as a string", async () => {
    const response = await api.post("/api/products").set("Authorization", authorization).send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ ...newProduct, id: expect.any(Number) });
  });

  it("keeps prices beyond Number.MAX_SAFE_INTEGER exact", async () => {
    const response = await api
      .post("/api/products")
      .set("Authorization", authorization)
      .send({ ...newProduct, price: "9223372036854775807" });

    expect(response.status).toBe(201);
    expect(response.body.data.price).toBe("9223372036854775807");
  });

  it("rejects invalid fields", async () => {
    const response = await api
      .post("/api/products")
      .set("Authorization", authorization)
      .send({ product_code: "", name: "Bad", price: 1000, stock: -1, color: "red" });

    expect(response.status).toBe(400);
    expect(response.body.errors.map((error: { field: string }) => error.field).sort()).toEqual(
      ["color", "price", "product_code", "stock"].sort(),
    );
  });

  it("rejects a duplicate product code with 409", async () => {
    const response = await api
      .post("/api/products")
      .set("Authorization", authorization)
      .send({ ...newProduct, product_code: "KBD-001" });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Product code already exists");
  });
});

describe("GET /api/products", () => {
  it("searches by name or code, case-insensitively", async () => {
    const byName = await api.get("/api/products?search=KEYBOARD").set("Authorization", authorization);
    const byCode = await api.get("/api/products?search=mou").set("Authorization", authorization);

    expect(byName.body.data.map((product: { product_code: string }) => product.product_code)).toEqual(["KBD-001"]);
    expect(byCode.body.data.map((product: { product_code: string }) => product.product_code)).toEqual(["MOU-001"]);
  });

  it("paginates the results", async () => {
    const response = await api.get("/api/products?page=2&limit=2").set("Authorization", authorization);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toEqual({ page: 2, limit: 2, total: 3, total_pages: 2 });
  });

  it("rejects an out-of-range limit instead of adjusting it", async () => {
    const response = await api.get("/api/products?limit=101").set("Authorization", authorization);

    expect(response.status).toBe(400);
  });
});

describe("PUT /api/products/:id", () => {
  it("updates an existing product", async () => {
    const created = await api.post("/api/products").set("Authorization", authorization).send(newProduct);

    const response = await api
      .put(`/api/products/${created.body.data.id}`)
      .set("Authorization", authorization)
      .send({ ...newProduct, name: "External SSD 2TB", price: "2199000" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ name: "External SSD 2TB", price: "2199000" });
  });

  it("returns 404 for an unknown product", async () => {
    const response = await api.put("/api/products/999999").set("Authorization", authorization).send(newProduct);

    expect(response.status).toBe(404);
  });
});
