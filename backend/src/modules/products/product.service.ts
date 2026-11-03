import { count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { products } from "../../db/schema/index.js";
import { AppError } from "../../utils/app-error.js";
import { getOffset } from "../../utils/pagination.js";
import { containsPattern } from "../../utils/search.js";
import type { ListProductsQuery, ProductBody } from "./product.schema.js";

export async function listProducts({ page, limit, search }: ListProductsQuery) {
  const searchFilter = search
    ? or(ilike(products.productCode, containsPattern(search)), ilike(products.name, containsPattern(search)))
    : undefined;

  const items = await db
    .select()
    .from(products)
    .where(searchFilter)
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit)
    .offset(getOffset(page, limit));

  const [result] = await db.select({ total: count() }).from(products).where(searchFilter);

  return { items, total: result?.total ?? 0 };
}

// A duplicate product_code is rejected by the unique constraint and mapped to 409 by the error handler
export async function createProduct(input: ProductBody) {
  const [product] = await db
    .insert(products)
    .values({
      productCode: input.product_code,
      name: input.name,
      price: input.price,
      stock: input.stock,
    })
    .returning();

  return product!;
}

export async function updateProduct(id: number, input: ProductBody) {
  const [product] = await db
    .update(products)
    .set({
      productCode: input.product_code,
      name: input.name,
      price: input.price,
      stock: input.stock,
    })
    .where(eq(products.id, id))
    .returning();

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  return product;
}
