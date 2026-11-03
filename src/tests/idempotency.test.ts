import { describe, it, expect, beforeEach } from "vitest";
import { globalIdempotencyEngine } from "../lib/idempotency";

describe("Idempotency Engine", () => {
  beforeEach(() => {
    globalIdempotencyEngine.clear();
  });

  it("should acquire lock for first-time key", () => {
    const payload = { orderId: 101, amount: 250 };
    const res = globalIdempotencyEngine.acquire("key_test_01", payload);
    expect(res.isDuplicate).toBe(false);
  });

  it("should detect duplicate when same key and payload are submitted", () => {
    const payload = { orderId: 102, amount: 350 };
    globalIdempotencyEngine.acquire("key_test_02", payload);
    globalIdempotencyEngine.complete("key_test_02", "evt_123");

    const duplicate = globalIdempotencyEngine.acquire("key_test_02", payload);
    expect(duplicate.isDuplicate).toBe(true);
    expect(duplicate.existingEventId).toBe("evt_123");
    expect(duplicate.isConflict).toBeUndefined();
  });

  it("should flag conflict when same key is submitted with altered payload", () => {
    const originalPayload = { orderId: 103, amount: 100 };
    const tamperedPayload = { orderId: 103, amount: 999 };

    globalIdempotencyEngine.acquire("key_test_03", originalPayload);
    const conflict = globalIdempotencyEngine.acquire("key_test_03", tamperedPayload);

    expect(conflict.isDuplicate).toBe(true);
    expect(conflict.isConflict).toBe(true);
  });
});
