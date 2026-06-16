/**
 * Lightweight, dependency-free rate limiting.
 *
 * Uses Upstash Redis (distributed, survives across serverless instances) when
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set; otherwise falls
 * back to a per-instance in-memory counter (best-effort — resets on cold start,
 * not shared between Vercel instances). Set the Upstash vars in production for
 * real protection across all instances.
 */

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const hits = new Map<string, { count: number; resetAt: number }>();

async function upstashIncr(key: string, windowSec: number): Promise<number | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    // INCR returns the new count; EXPIRE ... NX sets the TTL only on first hit.
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSec, "NX"],
      ]),
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result: unknown }[];
    const count = Number(data?.[0]?.result);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null; // never let the limiter take down the endpoint
  }
}

function memoryIncr(key: string, windowSec: number): number {
  const now = Date.now();
  // Opportunistically prune expired entries so the map can't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

/**
 * Fixed-window rate limit. Returns { ok: false } once `limit` is exceeded within
 * `windowSec`. Fails open (allows the request) if the backing store errors.
 */
export async function rateLimit(
  id: string,
  limit: number,
  windowSec: number
): Promise<{ ok: boolean }> {
  const key = `rl:${id}`;
  const count = (await upstashIncr(key, windowSec)) ?? memoryIncr(key, windowSec);
  return { ok: count <= limit };
}
