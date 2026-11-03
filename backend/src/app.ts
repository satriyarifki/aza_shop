import { Hono } from "hono";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { authRoutes } from "./modules/auth/auth.route.js";
import { productRoutes } from "./modules/products/product.route.js";

export const app = new Hono();

app.get("/health", (c) => c.json({ success: true, message: "OK" }));

app.route("/api/auth", authRoutes);
app.route("/api/products", productRoutes);

app.onError(errorHandler);
app.notFound(notFoundHandler);
