/**
 * Fixed-window rate limiter keyed by client (IP address). Kept in memory, so
 * on Netlify it limits per function instance: enough to stop a single form
 * being hammered, not a distributed attack.
 */
export interface RateLimiter {
  /** Records a hit and returns false once `key` exceeded the limit. */
  allow(key: string, now?: number): boolean;
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    allow(key, now = Date.now()) {
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        // Drop expired entries now and then so the map cannot grow forever.
        if (hits.size > 1000) {
          for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
        }
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      entry.count += 1;
      return entry.count <= limit;
    },
  };
}
