import { Hono } from "hono";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { sendSuccess } from "../../utils/response.js";
import { loginSchema } from "./auth.schema.js";
import * as authService from "./auth.service.js";

type UserRecord = Awaited<ReturnType<typeof authService.getCurrentUser>>;

function toUserResponse(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export const authRoutes = new Hono();

authRoutes.post("/login", validate("json", loginSchema), async (c) => {
  const input = c.req.valid("json");
  const { accessToken, user } = await authService.login(input);

  return sendSuccess(c, "Login successful", {
    access_token: accessToken,
    token_type: "Bearer",
    user: toUserResponse(user),
  });
});

authRoutes.get("/me", requireAuth, async (c) => {
  const user = await authService.getCurrentUser(c.get("user").id);

  return sendSuccess(c, "Current user retrieved successfully", toUserResponse(user));
});
