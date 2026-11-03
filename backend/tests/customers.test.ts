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

describe("POST /api/customers", () => {
  it("creates a customer and normalizes the input", async () => {
    const response = await api
      .post("/api/customers")
      .set("Authorization", authorization)
      .send({ name: "  Siti Rahmawati ", email: "Siti@Example.com", phone: "+62 812-0000-1111", address: "Bandung" });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      name: "Siti Rahmawati",
      email: "siti@example.com",
      phone: "+62 812-0000-1111",
      address: "Bandung",
    });
  });

  it("stores blank optional fields as null", async () => {
    const response = await api
      .post("/api/customers")
      .set("Authorization", authorization)
      .send({ name: "Andi", email: "", phone: "", address: "" });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ email: null, phone: null, address: null });
  });

  it("rejects a missing name and an invalid email", async () => {
    const response = await api.post("/api/customers").set("Authorization", authorization).send({ email: "nope" });

    expect(response.status).toBe(400);
    expect(response.body.errors.map((error: { field: string }) => error.field)).toEqual(["name", "email"]);
  });
});

describe("GET /api/customers", () => {
  it("lists and searches customers", async () => {
    await api.post("/api/customers").set("Authorization", authorization).send({ name: "Siti Rahmawati" });

    const all = await api.get("/api/customers").set("Authorization", authorization);
    const search = await api.get("/api/customers?search=siti").set("Authorization", authorization);

    expect(all.body.pagination.total).toBe(2);
    expect(search.body.data.map((customer: { name: string }) => customer.name)).toEqual(["Siti Rahmawati"]);
  });
});
