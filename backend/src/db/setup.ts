import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { env } from "../config/env.js";
import { createDatabaseIfMissing } from "./create-database.js";
import { db, pool } from "./index.js";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

try {
  await createDatabaseIfMissing(env.DATABASE_URL);
  await migrate(db, { migrationsFolder });
  console.log("Database is up to date");
} catch (error) {
  console.error("Database setup failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
