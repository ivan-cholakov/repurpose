import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tokens } from "@/db/schema";

type TokenType = (typeof tokens.$inferSelect)["type"];

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Create a single-use token for a user; returns the raw value for the emailed link. */
export async function createToken(userId: string, type: TokenType, ttlMs: number): Promise<string> {
  const raw = randomToken();
  // Retire any outstanding tokens of this type so only the latest link works.
  await db.delete(tokens).where(and(eq(tokens.userId, userId), eq(tokens.type, type)));
  await db.insert(tokens).values({
    userId,
    type,
    tokenHash: await sha256Hex(raw),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return raw;
}

/** Validate and burn a token. Returns the owning userId, or null if invalid. */
export async function consumeToken(raw: string, type: TokenType): Promise<string | null> {
  const tokenHash = await sha256Hex(raw);
  const rows = await db
    .select()
    .from(tokens)
    .where(and(eq(tokens.tokenHash, tokenHash), eq(tokens.type, type), isNull(tokens.usedAt)))
    .limit(1);
  const row = rows[0];
  if (!row || row.expiresAt.getTime() < Date.now()) return null;

  await db.update(tokens).set({ usedAt: new Date() }).where(eq(tokens.id, row.id));
  return row.userId;
}
