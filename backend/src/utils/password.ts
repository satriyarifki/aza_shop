import bcrypt from "bcrypt";
import { env } from "../config/env.js";

export function hashPassword(plainPassword: string) {
  return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
}

export function verifyPassword(plainPassword: string, passwordHash: string) {
  return bcrypt.compare(plainPassword, passwordHash);
}
