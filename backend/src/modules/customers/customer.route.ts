import { Hono } from "hono";
import type { customers } from "../../db/schema/index.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { sendPaginated, sendSuccess } from "../../utils/response.js";
import { createCustomerSchema, listCustomersQuerySchema } from "./customer.schema.js";
import * as customerService from "./customer.service.js";

type Customer = typeof customers.$inferSelect;

function toCustomerResponse(customer: Customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    created_at: customer.createdAt.toISOString(),
    updated_at: customer.updatedAt.toISOString(),
  };
}

export const customerRoutes = new Hono();

customerRoutes.use("*", requireAuth);

customerRoutes.get("/", validate("query", listCustomersQuerySchema), async (c) => {
  const query = c.req.valid("query");
  const { items, total } = await customerService.listCustomers(query);

  return sendPaginated(c, "Customers retrieved successfully", items.map(toCustomerResponse), {
    page: query.page,
    limit: query.limit,
    total,
  });
});

customerRoutes.post("/", validate("json", createCustomerSchema), async (c) => {
  const customer = await customerService.createCustomer(c.req.valid("json"));

  return sendSuccess(c, "Customer created successfully", toCustomerResponse(customer), 201);
});
