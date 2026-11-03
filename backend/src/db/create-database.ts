import pg from "pg";

// Connects to the server's default "postgres" database and creates the target database if needed
export async function createDatabaseIfMissing(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const databaseName = decodeURIComponent(url.pathname.slice(1));

  if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
    throw new Error(`Database name "${databaseName}" may only contain letters, digits and underscores`);
  }

  url.pathname = "/postgres";
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();

  try {
    const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);

    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`Created database ${databaseName}`);
    }
  } finally {
    await client.end();
  }
}
