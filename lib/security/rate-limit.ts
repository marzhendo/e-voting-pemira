/**
 * In-Memory Sliding Window IP Rate Limiter
 *
 * Designed for Next.js Route Handlers and Cloud Run / Nginx reverse proxies.
 * Uses X-Forwarded-For extracted via getClientIp() as the limiter key.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export class SlidingWindowRateLimiter {
  private readonly store = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private lastCleanup = Date.now();

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Checks whether `key` (typically client IP or IP+action) is within its quota
   * and records the attempt if allowed.
   */
  consume(key: string, now: number = Date.now()): RateLimitResult {
    this.cleanupExpired(now);

    const windowStart = now - this.windowMs;
    const timestamps = (this.store.get(key) || []).filter((ts) => ts > windowStart);

    if (timestamps.length >= this.maxRequests) {
      const oldestInWindow = timestamps[0];
      const retryAfterMs = Math.max(1000, oldestInWindow + this.windowMs - now);
      this.store.set(key, timestamps);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      };
    }

    timestamps.push(now);
    this.store.set(key, timestamps);

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - timestamps.length),
      retryAfterSeconds: 0,
    };
  }

  reset(): void {
    this.store.clear();
  }

  private cleanupExpired(now: number): void {
    if (now - this.lastCleanup < this.windowMs) return;
    this.lastCleanup = now;
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.store.entries()) {
      const active = timestamps.filter((ts) => ts > windowStart);
      if (active.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, active);
      }
    }
  }
}

// Shared limiters across authentication and public verification routes
export const otpRequestRateLimiter = new SlidingWindowRateLimiter(10, 60 * 1000); // 10 req/min per IP
export const otpVerifyRateLimiter = new SlidingWindowRateLimiter(15, 60 * 1000);  // 15 req/min per IP
export const publicVerifyRateLimiter = new SlidingWindowRateLimiter(20, 60 * 1000); // 20 req/min per IP
