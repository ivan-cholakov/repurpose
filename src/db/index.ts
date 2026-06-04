import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/lib/env";
import * as schema from "./schema";

// libsql works with a local file (file:./dev.db) in dev and a Turso URL + auth
// token in production — same client, just different env values.
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof createClient> | undefined;
};

const client =
  globalForDb.client ??
  createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

// For a local SQLite file, let writers wait for the lock instead of failing
// immediately with SQLITE_BUSY under concurrent requests. (No-op for remote Turso.)
if (!globalForDb.client && env.DATABASE_URL.startsWith("file:")) {
  void client.execute("PRAGMA busy_timeout = 5000").catch(() => {});
}

if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
export { schema };
