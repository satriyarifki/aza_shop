import { createMiddleware } from "hono/factory";
import { verifyAccessToken } from "../modules/auth/auth.service.js";
import { AppError } from "../utils/app-error.js";

export const requireAuth = createMiddleware(async (c, next) => {
  const authorization = c.req.header("Authorization");

  if (!authorization) {
    throw new AppError(401, "Authentication required");
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "Authorization header must use the Bearer scheme");
  }

  const user = await verifyAccessToken(token);
  c.set("user", user);

  await next();
});
