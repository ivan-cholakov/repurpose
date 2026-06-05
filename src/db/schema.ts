import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),

  // Billing
  plan: text("plan", { enum: ["free", "pro"] })
    .notNull()
    .default("free"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),

  // Optional voice/style notes injected into every generation prompt so the
  // output sounds like the author, not generic AI.
  voiceNotes: text("voice_notes"),

  // Usage metering (resets monthly)
  usageCount: integer("usage_count").notNull().default(0),
  usagePeriodStart: integer("usage_period_start", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const generations = sqliteTable("generations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  formats: text("formats").notNull(),
  sourceLen: integer("source_len").notNull(),
  // Full content so users can revisit past repurposes. `results` is a JSON
  // array of { format, label, content }. Defaults keep pre-existing rows valid.
  source: text("source").notNull().default(""),
  results: text("results").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Generation = typeof generations.$inferSelect;
