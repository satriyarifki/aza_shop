import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/index.js";

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
