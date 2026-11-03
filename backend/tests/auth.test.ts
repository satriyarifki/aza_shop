import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../src/db/index.js";
import { ADMIN_EMAIL, ADMIN_PASSWORD, api, loginAsAdmin, resetDatabase } from "./helpers.js";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe("POST /api/auth/login", () => {
  it("returns an access token and the user without the password", async () => {
    const response = await api.post("/api/auth/login").send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.data.access_token).toEqual(expect.any(String));
    expect(response.body.data.token_type).toBe("Bearer");
    expect(response.body.data.user).toMatchObject({ email: ADMIN_EMAIL, role: "ADMIN" });
    expect(JSON.stringify(response.body)).not.toContain("password");
  });

  it.each([
    { case: "wrong password", email: ADMIN_EMAIL, password: "wrong-password" },
    { case: "unknown email", email: "nobody@example.com", password: ADMIN_PASSWORD },
  ])("rejects invalid credentials ($case) with a generic message", async ({ email, password }) => {
    const response = await api.post("/api/auth/login").send({ email, password });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ success: false, message: "Invalid email or password" });
  });

  it("validates the request body", async () => {
    const response = await api.post("/api/auth/login").send({ email: "not-an-email" });

    expect(response.status).toBe(400);
    expect(response.body.errors.map((error: { field: string }) => error.field)).toEqual(["email", "password"]);
  });
});

describe("protected endpoints", () => {
  it.each([
    ["GET", "/api/auth/me"],
    ["GET", "/api/products"],
    ["POST", "/api/products"],
    ["GET", "/api/customers"],
    ["GET", "/api/orders"],
    ["POST", "/api/orders"],
    ["PATCH", "/api/orders/1/pay"],
    ["PATCH", "/api/orders/1/cancel"],
  ])("rejects unauthenticated %s %s with 401", async (method, path) => {
    const response = await api[method.toLowerCase() as "get" | "post" | "patch"](path);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects an invalid token", async () => {
    const response = await api.get("/api/products").set("Authorization", "Bearer not.a.valid-token");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid token");
  });

  it("returns the current user for a valid token", async () => {
    const authorization = await loginAsAdmin();
    const response = await api.get("/api/auth/me").set("Authorization", authorization);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ email: ADMIN_EMAIL, role: "ADMIN" });
  });
});
