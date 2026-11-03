import bcrypt from "bcrypt";
import { env } from "../config/env.js";

export function hashPassword(plainPassword: string) {
  return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
}
