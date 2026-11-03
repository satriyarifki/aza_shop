import { Hono } from "hono";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

export const app = new Hono();

app.get("/health", (c) => c.json({ success: true, message: "OK" }));

app.onError(errorHandler);
app.notFound(notFoundHandler);
