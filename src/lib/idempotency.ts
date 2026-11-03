import crypto from "crypto";

/**
 * Idempotency Engine
 * Conforms to IETF Idempotency-Key specifications.
 * Prevents duplicate processing of incoming requests within a configurable TTL window.
 */

interface IdempotencyRecord {
  key: string;
  hash: string;
  status: "IN_FLIGHT" | "COMPLETED";
  eventId?: string;
  response?: unknown;
  createdAt: number;
  expiresAt: number;
}

class IdempotencyEngine {
  private cache: Map<string, IdempotencyRecord> = new Map();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlMs = 24 * 60 * 60 * 1000) { // 24 hours default
    this.defaultTtlMs = defaultTtlMs;
  }

  public computePayloadHash(payload: unknown): string {
    return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  }

  /**
   * Acquire or inspect idempotency record
   * Returns:
   * - isDuplicate: boolean
   * - existingEventId?: string
   * - isConflict?: boolean (same key, different payload)
   */
  public acquire(
    key: string,
    payload: unknown
  ): { isDuplicate: boolean; existingEventId?: string; isConflict?: boolean } {
    const now = Date.now();
    const hash = this.computePayloadHash(payload);
    const existing = this.cache.get(key);

    if (existing) {
      if (existing.expiresAt > now) {
        // If the key is the same but payload hash differs, it's an HTTP 422 Unprocessable / Conflict
        if (existing.hash !== hash) {
          return { isDuplicate: true, isConflict: true };
        }
        return { isDuplicate: true, existingEventId: existing.eventId };
      }
      // Expired record
      this.cache.delete(key);
    }

    // Register new in-flight record
    this.cache.set(key, {
      key,
      hash,
      status: "IN_FLIGHT",
      createdAt: now,
      expiresAt: now + this.defaultTtlMs,
    });

    return { isDuplicate: false };
  }

  public complete(key: string, eventId: string, response?: unknown): void {
    const record = this.cache.get(key);
    if (record) {
      record.status = "COMPLETED";
      record.eventId = eventId;
      record.response = response;
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const globalIdempotencyEngine = new IdempotencyEngine();
