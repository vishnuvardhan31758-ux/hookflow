import { describe, it, expect } from "vitest";
import { CircuitBreaker } from "../lib/circuit-breaker";

describe("Circuit Breaker State Machine", () => {
  it("should initialize in CLOSED state and allow execution", () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownPeriodMs: 5000 });
    expect(cb.getState()).toBe("CLOSED");
    expect(cb.canExecute()).toBe(true);
  });

  it("should trip to OPEN after consecutive failures reach threshold", () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownPeriodMs: 5000 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe("CLOSED");
    expect(cb.canExecute()).toBe(true);

    cb.recordFailure(); // 3rd failure reaches threshold
    expect(cb.getState()).toBe("OPEN");
    expect(cb.canExecute()).toBe(false);
  });

  it("should transition from OPEN to HALF_OPEN after cooldown period", () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownPeriodMs: 50 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe("OPEN");

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(cb.getState()).toBe("HALF_OPEN");
        expect(cb.canExecute()).toBe(true);

        // Success in HALF_OPEN resets circuit back to CLOSED
        cb.recordSuccess();
        expect(cb.getState()).toBe("CLOSED");
        resolve();
      }, 70);
    });
  });
});
