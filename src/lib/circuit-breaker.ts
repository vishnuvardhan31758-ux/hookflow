import { CircuitState } from "./types";

/**
 * Circuit Breaker Pattern Implementation
 * Reference: Martin Fowler - CircuitBreaker Design Pattern
 *
 * Protects downstream destination webhooks from cascading failures during outages.
 * States:
 *   - CLOSED: Normal operation, monitoring failure rates.
 *   - OPEN: Failing fast; requests are stopped immediately to allow destination recovery.
 *   - HALF_OPEN: Trial probe sent; success resets circuit, failure reopens it.
 */

export interface CircuitBreakerConfig {
  failureThreshold: number; // consecutive failures before tripping (default 3)
  cooldownPeriodMs: number; // time spent in OPEN state before trying HALF_OPEN (default 15s)
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private consecutiveFailures = 0;
  private openUntilTimestamp = 0;
  private readonly config: CircuitBreakerConfig;
  private tripCount = 0;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 3,
      cooldownPeriodMs: config.cooldownPeriodMs ?? 15000,
    };
  }

  public getState(): CircuitState {
    if (this.state === "OPEN") {
      if (Date.now() >= this.openUntilTimestamp) {
        this.state = "HALF_OPEN";
      }
    }
    return this.state;
  }

  public canExecute(): boolean {
    const currentState = this.getState();
    return currentState === "CLOSED" || currentState === "HALF_OPEN";
  }

  public recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = "CLOSED";
  }

  public recordFailure(): void {
    this.consecutiveFailures++;

    if (this.state === "HALF_OPEN" || this.consecutiveFailures >= this.config.failureThreshold) {
      this.state = "OPEN";
      this.openUntilTimestamp = Date.now() + this.config.cooldownPeriodMs;
      this.tripCount++;
    }
  }

  public forceState(state: CircuitState): void {
    this.state = state;
    if (state === "OPEN") {
      this.openUntilTimestamp = Date.now() + this.config.cooldownPeriodMs;
    } else if (state === "CLOSED") {
      this.consecutiveFailures = 0;
    }
  }

  public getSnapshot() {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      failureThreshold: this.config.failureThreshold,
      openUntilTimestamp: this.openUntilTimestamp,
      tripCount: this.tripCount,
    };
  }

  public reset(): void {
    this.state = "CLOSED";
    this.consecutiveFailures = 0;
    this.openUntilTimestamp = 0;
    this.tripCount = 0;
  }
}

// Destination circuit registry
class CircuitBreakerRegistry {
  private registry: Map<string, CircuitBreaker> = new Map();

  public get(destinationId: string, threshold = 3): CircuitBreaker {
    let cb = this.registry.get(destinationId);
    if (!cb) {
      cb = new CircuitBreaker({ failureThreshold: threshold });
      this.registry.set(destinationId, cb);
    }
    return cb;
  }

  public getAll(): Record<string, ReturnType<CircuitBreaker["getSnapshot"]>> {
    const snapshots: Record<string, ReturnType<CircuitBreaker["getSnapshot"]>> = {};
    for (const [id, cb] of this.registry.entries()) {
      snapshots[id] = cb.getSnapshot();
    }
    return snapshots;
  }
}

export const globalCircuitRegistry = new CircuitBreakerRegistry();
