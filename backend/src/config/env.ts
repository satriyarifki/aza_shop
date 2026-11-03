import { config } from "dotenv";
import { z } from "zod";

// Tests run against their own database, configured in .env.test
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
config({ path: envFile, quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z.string().min(1).startsWith("postgres"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().min(1).default("8h"),

  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  APP_TIMEZONE: z.string().min(1).default("Asia/Jakarta"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`Invalid environment configuration (${envFile}):`);
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
