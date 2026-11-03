import { describe, it, expect } from "vitest";
import { calculateBackoffDelay, shouldRetry } from "../lib/retry";

describe("Exponential Backoff & Retry Logic", () => {
  it("should calculate increasing exponential backoff without jitter", () => {
    const config = { baseDelayMs: 1000, maxDelayMs: 32000, factor: 2, jitter: false };
    expect(calculateBackoffDelay(1, config)).toBe(1000); // 1000 * 2^0
    expect(calculateBackoffDelay(2, config)).toBe(2000); // 1000 * 2^1
    expect(calculateBackoffDelay(3, config)).toBe(4000); // 1000 * 2^2
    expect(calculateBackoffDelay(4, config)).toBe(8000); // 1000 * 2^3
  });

  it("should cap delay at maxDelayMs", () => {
    const config = { baseDelayMs: 1000, maxDelayMs: 5000, factor: 2, jitter: false };
    expect(calculateBackoffDelay(10, config)).toBe(5000);
  });

  it("should determine retryable HTTP statuses correctly", () => {
    // Retryable: 5xx and 429
    expect(shouldRetry(500)).toBe(true);
    expect(shouldRetry(502)).toBe(true);
    expect(shouldRetry(503)).toBe(true);
    expect(shouldRetry(429)).toBe(true);
    expect(shouldRetry(undefined)).toBe(true); // Network errors

    // Non-retryable: 4xx client errors
    expect(shouldRetry(400)).toBe(false);
    expect(shouldRetry(401)).toBe(false);
    expect(shouldRetry(403)).toBe(false);
    expect(shouldRetry(404)).toBe(false);
    expect(shouldRetry(422)).toBe(false);
  });
});
