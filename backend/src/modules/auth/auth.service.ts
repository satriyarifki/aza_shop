import { eq } from "drizzle-orm";
import { errors as joseErrors, jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema/index.js";
import { AppError } from "../../utils/app-error.js";
import { verifyPassword } from "../../utils/password.js";
import type { LoginInput } from "./auth.schema.js";
import type { AuthUser } from "./auth.types.js";

const JWT_ALGORITHM = "HS256";
const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

const tokenPayloadSchema = z.object({
  sub: z.coerce.number().int().positive(),
  email: z.string(),
  role: z.literal("ADMIN"),
});

const publicUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export async function login(input: LoginInput) {
  const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

  const isPasswordValid = user ? await verifyPassword(input.password, user.password) : false;

  if (!user || !isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const accessToken = await signAccessToken({ id: user.id, email: user.email, role: user.role });
  const { password: _password, ...publicUser } = user;

  return { accessToken, user: publicUser };
}

export async function getCurrentUser(userId: number) {
  const [user] = await db.select(publicUserColumns).from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new AppError(401, "User no longer exists");
  }

  return user;
}

export function signAccessToken(user: AuthUser) {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(jwtSecret);
}

export async function verifyAccessToken(token: string): Promise<AuthUser> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret, { algorithms: [JWT_ALGORITHM] });
    const claims = tokenPayloadSchema.parse(payload);

    return { id: claims.sub, email: claims.email, role: claims.role };
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      throw new AppError(401, "Token has expired");
    }
    throw new AppError(401, "Invalid token");
  }
}
