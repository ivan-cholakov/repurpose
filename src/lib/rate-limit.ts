import "server-only";

// Sliding-window rate limiter, in memory. Suitable for the single-instance
// deployment this app targets (one container, one SQLite file); a multi-node
// deployment would need a shared store instead.
//
// Active in production, or when FORCE_RATE_LIMIT=1 (so it can be exercised in
// tests without throttling the rest of the e2e suite).

const windows = new Map<string, number[]>();

function enabled(): boolean {
  return process.env.NODE_ENV === "production" || process.env.FORCE_RATE_LIMIT === "1";
}

export function clientIp(req: Request): string {
  // First hop of x-forwarded-for; fine behind a single trusted proxy.
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}

/**
 * Record a hit for `key` and report whether it exceeds `limit` per `windowMs`.
 * Returns true when the request should proceed.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  if (!enabled()) return true;

  const now = Date.now();
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    windows.set(key, hits);
    return false;
  }
  hits.push(now);
  windows.set(key, hits);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (windows.size > 10_000) {
    for (const [k, v] of windows) {
      if (v.every((t) => now - t >= windowMs)) windows.delete(k);
    }
  }
  return true;
}

export const tooMany = { error: "Too many attempts. Please try again later." };
