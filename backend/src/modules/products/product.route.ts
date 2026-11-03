import { Hono } from "hono";
import type { products } from "../../db/schema/index.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { sendPaginated, sendSuccess } from "../../utils/response.js";
import { listProductsQuerySchema, productBodySchema, productIdParamSchema } from "./product.schema.js";
import * as productService from "./product.service.js";

type Product = typeof products.$inferSelect;

function toProductResponse(product: Product) {
  return {
    id: product.id,
    product_code: product.productCode,
    name: product.name,
    price: product.price.toString(),
    stock: product.stock,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString(),
  };
}

export const productRoutes = new Hono();

productRoutes.use("*", requireAuth);

productRoutes.get("/", validate("query", listProductsQuerySchema), async (c) => {
  const query = c.req.valid("query");
  const { items, total } = await productService.listProducts(query);

  return sendPaginated(c, "Products retrieved successfully", items.map(toProductResponse), {
    page: query.page,
    limit: query.limit,
    total,
  });
});

productRoutes.post("/", validate("json", productBodySchema), async (c) => {
  const product = await productService.createProduct(c.req.valid("json"));

  return sendSuccess(c, "Product created successfully", toProductResponse(product), 201);
});

productRoutes.put(
  "/:id",
  validate("param", productIdParamSchema),
  validate("json", productBodySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const product = await productService.updateProduct(id, c.req.valid("json"));

    return sendSuccess(c, "Product updated successfully", toProductResponse(product));
  },
);
