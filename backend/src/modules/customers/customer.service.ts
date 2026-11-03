import { count, desc, ilike, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { customers } from "../../db/schema/index.js";
import { getOffset } from "../../utils/pagination.js";
import { containsPattern } from "../../utils/search.js";
import type { CreateCustomerInput, ListCustomersQuery } from "./customer.schema.js";

export async function listCustomers({ page, limit, search }: ListCustomersQuery) {
  const searchFilter = search
    ? or(
        ilike(customers.name, containsPattern(search)),
        ilike(customers.email, containsPattern(search)),
        ilike(customers.phone, containsPattern(search)),
      )
    : undefined;

  const items = await db
    .select()
    .from(customers)
    .where(searchFilter)
    .orderBy(desc(customers.createdAt), desc(customers.id))
    .limit(limit)
    .offset(getOffset(page, limit));

  const [result] = await db.select({ total: count() }).from(customers).where(searchFilter);

  return { items, total: result?.total ?? 0 };
}

export async function createCustomer(input: CreateCustomerInput) {
  const [customer] = await db
    .insert(customers)
    .values({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
    })
    .returning();

  return customer!;
}
