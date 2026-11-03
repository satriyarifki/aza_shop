import type { AuthUser } from "../modules/auth/auth.types.js";

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}
