#!/usr/bin/env node
// Applies generated Drizzle migrations (./drizzle) to the database.
// Usage: node --env-file=.env scripts/migrate.mjs
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
const db = drizzle(client);

console.log(`Applying migrations to ${url} ...`);
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied.");
client.close();
