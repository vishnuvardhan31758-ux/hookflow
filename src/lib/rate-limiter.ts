import { RateLimitResult } from "./types";

/**
 * Token Bucket Rate Limiting Algorithm
 * Standard distributed gateway algorithm used to handle traffic bursts while enforcing sustained capacity.
 */
interface Bucket {
  tokens: number;
  lastRefillTimestamp: number;
}

class TokenBucketRateLimiter {
  private buckets: Map<string, Bucket> = new Map();
  private readonly capacity: number;
  private readonly refillRatePerSecond: number;

  constructor(capacity = 20, refillRatePerSecond = 5) {
    this.capacity = capacity;
    this.refillRatePerSecond = refillRatePerSecond;
  }

  public check(key: string, cost = 1): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.capacity,
        lastRefillTimestamp: now,
      };
      this.buckets.set(key, bucket);
    } else {
      // Calculate continuous token replenishment
      const elapsedSeconds = (now - bucket.lastRefillTimestamp) / 1000;
      const tokensToAdd = elapsedSeconds * this.refillRatePerSecond;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefillTimestamp = now;
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return {
        allowed: true,
        tokensRemaining: Math.floor(bucket.tokens),
        capacity: this.capacity,
        resetMs: Math.ceil(((this.capacity - bucket.tokens) / this.refillRatePerSecond) * 1000),
      };
    }

    return {
      allowed: false,
      tokensRemaining: Math.floor(bucket.tokens),
      capacity: this.capacity,
      resetMs: Math.ceil(((cost - bucket.tokens) / this.refillRatePerSecond) * 1000),
    };
  }

  public reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }
}

// Global singleton rate limiter for edge/serverless reuse
export const globalRateLimiter = new TokenBucketRateLimiter(30, 10);
