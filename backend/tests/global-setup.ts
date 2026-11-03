import { fileURLToPath } from "node:url";

// Runs once before all test files: prepares the dedicated test database
export default async function setup() {
  process.env.NODE_ENV = "test";

  const { env } = await import("../src/config/env.js");
  const databaseName = new URL(env.DATABASE_URL).pathname.slice(1);

  // Tests wipe every table, so never let them touch a non-test database
  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Tests must use a database whose name ends with "_test" (got "${databaseName}"). Check .env.test.`,
    );
  }

  const { createDatabaseIfMissing } = await import("../src/db/create-database.js");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const { db, pool } = await import("../src/db/index.js");

  await createDatabaseIfMissing(env.DATABASE_URL);
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  await pool.end();
}
