import {
  WebhookEvent,
  WebhookDestination,
  EventStatus,
  MetricsSummary,
  DeliveryAttempt,
} from "./types";
import { globalCircuitRegistry } from "./circuit-breaker";
import { calculateBackoffDelay, shouldRetry } from "./retry";
import { globalSSEBroker } from "./sse-broker";
import crypto from "crypto";

/**
 * HookFlow In-Memory & Distributed Datastore Layer
 * Operates as high-speed resilient event ledger with Neon / PostgreSQL sync readiness.
 */
class HookFlowStore {
  private events: Map<string, WebhookEvent> = new Map();
  private destinations: Map<string, WebhookDestination> = new Map();

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Seed default sample destinations
    const defaultDests: WebhookDestination[] = [
      {
        id: "dest_healthy",
        name: "Production Billing Consumer (Healthy 200)",
        url: "https://httpbin.org/status/200",
        secret: "sec_live_wh_billing_9921",
        createdAt: Date.now() - 3600000,
        enabled: true,
        failureThreshold: 3,
        circuitState: "CLOSED",
        consecutiveFailures: 0,
      },
      {
        id: "dest_unstable",
        name: "Legacy Inventory Service (Simulated 500 Failures)",
        url: "https://httpbin.org/status/500",
        secret: "sec_live_wh_inventory_4410",
        createdAt: Date.now() - 3600000,
        enabled: true,
        failureThreshold: 3,
        circuitState: "CLOSED",
        consecutiveFailures: 0,
      },
      {
        id: "dest_ratelimited",
        name: "Rate-Limited CRM Ingestion (Simulated 429)",
        url: "https://httpbin.org/status/429",
        secret: "sec_live_wh_crm_7730",
        createdAt: Date.now() - 3600000,
        enabled: true,
        failureThreshold: 4,
        circuitState: "CLOSED",
        consecutiveFailures: 0,
      },
    ];

    for (const d of defaultDests) {
      this.destinations.set(d.id, d);
    }
  }

  public getDestinations(): WebhookDestination[] {
    const list = Array.from(this.destinations.values());
    // Refresh circuit state
    for (const dest of list) {
      const cb = globalCircuitRegistry.get(dest.id, dest.failureThreshold);
      dest.circuitState = cb.getState();
      dest.consecutiveFailures = cb.getSnapshot().consecutiveFailures;
    }
    return list;
  }

  public getDestination(id: string): WebhookDestination | undefined {
    const dest = this.destinations.get(id);
    if (dest) {
      const cb = globalCircuitRegistry.get(dest.id, dest.failureThreshold);
      dest.circuitState = cb.getState();
      dest.consecutiveFailures = cb.getSnapshot().consecutiveFailures;
    }
    return dest;
  }

  public addDestination(data: Omit<WebhookDestination, "id" | "createdAt" | "circuitState" | "consecutiveFailures">): WebhookDestination {
    const id = `dest_${crypto.randomBytes(6).toString("hex")}`;
    const destination: WebhookDestination = {
      ...data,
      id,
      createdAt: Date.now(),
      circuitState: "CLOSED",
      consecutiveFailures: 0,
    };
    this.destinations.set(id, destination);
    return destination;
  }

  public updateDestination(id: string, updates: Partial<WebhookDestination>): WebhookDestination | undefined {
    const existing = this.destinations.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.destinations.set(id, updated);
    return updated;
  }

  public deleteDestination(id: string): boolean {
    return this.destinations.delete(id);
  }

  public getEvents(options?: {
    status?: EventStatus;
    source?: string;
    limit?: number;
  }): WebhookEvent[] {
    let list = Array.from(this.events.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );

    if (options?.status) {
      list = list.filter((e) => e.status === options.status);
    }

    if (options?.source) {
      list = list.filter((e) =>
        e.source.toLowerCase().includes(options.source!.toLowerCase())
      );
    }

    if (options?.limit && options.limit > 0) {
      list = list.slice(0, options.limit);
    }

    return list;
  }

  public getEvent(id: string): WebhookEvent | undefined {
    return this.events.get(id);
  }

  public saveEvent(event: WebhookEvent): WebhookEvent {
    this.events.set(event.id, event);
    globalSSEBroker.broadcast("event_updated", event);
    return event;
  }

  public deleteEvent(id: string): boolean {
    const deleted = this.events.delete(id);
    if (deleted) {
      globalSSEBroker.broadcast("event_deleted", { id });
    }
    return deleted;
  }

  /**
   * Core Delivery Dispatcher
   * Executes HTTP POST, inspects status code, triggers circuit breaker updates,
   * schedules retries with exponential backoff or elevates to DLQ.
   */
  public async dispatchEvent(event: WebhookEvent): Promise<WebhookEvent> {
    const dest = Array.from(this.destinations.values()).find(
      (d) => d.url === event.destinationUrl
    );
    const destId = dest?.id || "dest_dynamic";
    const cb = globalCircuitRegistry.get(destId, dest?.failureThreshold || 3);

    // 1. Check Circuit Breaker
    if (!cb.canExecute()) {
      event.status = "CIRCUIT_BROKEN";
      event.circuitStateAtDelivery = "OPEN";
      event.updatedAt = Date.now();
      this.saveEvent(event);
      return event;
    }

    event.status = "PROCESSING";
    event.updatedAt = Date.now();
    this.saveEvent(event);

    const attemptNumber = event.attempts.length + 1;
    const startTime = Date.now();

    const attempt: DeliveryAttempt = {
      id: `att_${crypto.randomBytes(6).toString("hex")}`,
      attemptNumber,
      timestamp: startTime,
      durationMs: 0,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(event.destinationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "HookFlow-Engine/1.0",
          "X-HookFlow-Event-Id": event.id,
          "X-HookFlow-Signature": event.signature,
          "X-HookFlow-Attempt": String(attemptNumber),
          ...event.headers,
        },
        body: JSON.stringify(event.payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;
      const responseText = await response.text().catch(() => "");

      attempt.durationMs = durationMs;
      attempt.statusCode = response.status;
      attempt.responseBody = responseText.slice(0, 1000); // Cap response length

      if (response.ok) {
        // Success (2xx)
        cb.recordSuccess();
        event.status = "DELIVERED";
        event.circuitStateAtDelivery = "CLOSED";
      } else {
        // Non-2xx response
        const retryable = shouldRetry(response.status);

        if (retryable && event.retryCount < event.maxRetries) {
          event.retryCount++;
          event.status = "RETRYING";
          const backoffDelay = calculateBackoffDelay(event.retryCount);
          attempt.nextRetryTimestamp = Date.now() + backoffDelay;

          // Schedule async retry
          setTimeout(() => {
            this.dispatchEvent(event).catch(console.error);
          }, Math.min(backoffDelay, 15000)); // Cap local test delay to 15s max
        } else {
          // Reached max retries or non-retryable error
          cb.recordFailure();
          event.status = "FAILED_DLQ";
        }
      }
    } catch (err: unknown) {
      // Network timeout / DNS / connection failure
      const durationMs = Date.now() - startTime;
      attempt.durationMs = durationMs;
      attempt.error = err instanceof Error ? err.message : "Network failure";

      cb.recordFailure();

      if (event.retryCount < event.maxRetries) {
        event.retryCount++;
        event.status = "RETRYING";
        const backoffDelay = calculateBackoffDelay(event.retryCount);
        attempt.nextRetryTimestamp = Date.now() + backoffDelay;

        setTimeout(() => {
          this.dispatchEvent(event).catch(console.error);
        }, Math.min(backoffDelay, 15000));
      } else {
        event.status = "FAILED_DLQ";
      }
    }

    event.attempts.push(attempt);
    event.updatedAt = Date.now();
    return this.saveEvent(event);
  }

  public getMetrics(): MetricsSummary {
    const all = Array.from(this.events.values());
    const totalReceived = all.length;
    const delivered = all.filter((e) => e.status === "DELIVERED" || e.status === "REPLAYED");
    const retrying = all.filter((e) => e.status === "RETRYING" || e.status === "PROCESSING");
    const dlq = all.filter((e) => e.status === "FAILED_DLQ" || e.status === "CIRCUIT_BROKEN");

    const durations: number[] = [];
    for (const e of all) {
      for (const a of e.attempts) {
        if (a.durationMs > 0) durations.push(a.durationMs);
      }
    }

    durations.sort((a, b) => a - b);
    const avgLatency =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
    const p95Index = Math.floor(durations.length * 0.95);
    const p95Latency = durations.length > 0 ? durations[p95Index] || avgLatency : 0;

    let tripCount = 0;
    const allCircuits = globalCircuitRegistry.getAll();
    for (const id in allCircuits) {
      tripCount += allCircuits[id].tripCount;
    }

    return {
      totalReceived,
      totalDelivered: delivered.length,
      totalRetrying: retrying.length,
      totalDLQ: dlq.length,
      successRate:
        totalReceived > 0
          ? Math.round((delivered.length / totalReceived) * 100)
          : 100,
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      circuitBreakerTrips: tripCount,
    };
  }

  public clearAll(): void {
    this.events.clear();
  }
}

export const globalStore = new HookFlowStore();
