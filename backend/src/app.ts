import { Hono } from "hono";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { customerRoutes } from "./modules/customers/customer.route.js";
import { orderRoutes } from "./modules/orders/order.route.js";
import { productRoutes } from "./modules/products/product.route.js";

export const app = new Hono();

app.get("/health", (c) => c.json({ success: true, message: "OK" }));

app.route("/api/auth", authRoutes);
app.route("/api/products", productRoutes);
app.route("/api/customers", customerRoutes);
app.route("/api/orders", orderRoutes);

app.onError(errorHandler);
app.notFound(notFoundHandler);
