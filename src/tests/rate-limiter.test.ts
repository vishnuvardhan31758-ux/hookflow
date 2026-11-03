import { describe, it, expect, beforeEach } from "vitest";
import { globalRateLimiter } from "../lib/rate-limiter";

describe("Token-Bucket Rate Limiter", () => {
  beforeEach(() => {
    globalRateLimiter.reset();
  });

  it("should allow initial requests within capacity", () => {
    const res = globalRateLimiter.check("ip_127_0_0_1", 1);
    expect(res.allowed).toBe(true);
    expect(res.tokensRemaining).toBeGreaterThanOrEqual(0);
  });

  it("should reject requests when token capacity is depleted", () => {
    const ip = "ip_exhaustion_test";
    // Drain all tokens
    for (let i = 0; i < 30; i++) {
      globalRateLimiter.check(ip, 1);
    }

    const exhausted = globalRateLimiter.check(ip, 1);
    expect(exhausted.allowed).toBe(false);
    expect(exhausted.resetMs).toBeGreaterThan(0);
  });
});
