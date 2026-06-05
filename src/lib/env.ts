import "server-only";
import { z } from "zod";

// Treat empty-string env vars (common in placeholder .env files) as "unset" so
// optional secrets validate cleanly until they're actually provided.
const optional = <T extends z.ZodType>(inner: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), inner.optional());

// Server-side environment, validated with Zod. Secrets are optional at boot so the
// app can build and run in a degraded state until they're provided; the code paths
// that need a given secret assert it where used (see requireEnv).
const EnvSchema = z.object({
  DATABASE_URL: z.preprocess(
    (v) => (v === "" || v === undefined ? "file:./dev.db" : v),
    z.string().min(1),
  ),
  DATABASE_AUTH_TOKEN: optional(z.string().min(1)),
  AUTH_SECRET: optional(z.string().min(16, "AUTH_SECRET should be a long random string")),
  ANTHROPIC_API_KEY: optional(z.string().min(1)),
  RESEND_API_KEY: optional(z.string().min(1)),
  EMAIL_FROM: optional(z.string().min(1)),
  STRIPE_SECRET_KEY: optional(z.string().min(1)),
  STRIPE_WEBHOOK_SECRET: optional(z.string().min(1)),
  STRIPE_PRICE_ID: optional(z.string().min(1)),
  STRIPE_PRICE_ID_ANNUAL: optional(z.string().min(1)),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (v) => (v === "" || v === undefined ? "http://localhost:3000" : v),
    z.url(),
  ),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // Surface a readable message instead of a raw ZodError dump.
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env: Env = parsed.data;

/** Assert that a required secret is present at the point of use. */
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${String(key)}`);
  }
  return value as NonNullable<Env[K]>;
}
