import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { customerRoutes } from "./modules/customers/customer.route.js";
import { orderRoutes } from "./modules/orders/order.route.js";
import { productRoutes } from "./modules/products/product.route.js";

export const app = new Hono();

app.get("/health", (c) => c.json({ success: true, message: "OK" }));

app.use(
  "/api/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.route("/api/auth", authRoutes);
app.route("/api/products", productRoutes);
app.route("/api/customers", customerRoutes);
app.route("/api/orders", orderRoutes);

app.onError(errorHandler);
app.notFound(notFoundHandler);
