import { z } from "zod";

export type EventStatus =
  | "PENDING"
  | "PROCESSING"
  | "DELIVERED"
  | "RETRYING"
  | "FAILED_DLQ"
  | "CIRCUIT_BROKEN"
  | "REPLAYED";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface DeliveryAttempt {
  id: string;
  attemptNumber: number;
  timestamp: number;
  statusCode?: number;
  durationMs: number;
  responseBody?: string;
  error?: string;
  nextRetryTimestamp?: number;
}

export interface WebhookEvent {
  id: string;
  idempotencyKey: string;
  source: string;              // e.g., 'stripe.payment_intent.succeeded', 'github.push'
  destinationUrl: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  signature: string;
  status: EventStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  updatedAt: number;
  attempts: DeliveryAttempt[];
  circuitStateAtDelivery?: CircuitState;
}

export interface WebhookDestination {
  id: string;
  name: string;
  url: string;
  secret: string;
  createdAt: number;
  enabled: boolean;
  failureThreshold: number;   // Circuit breaker threshold
  circuitState: CircuitState;
  consecutiveFailures: number;
  circuitOpenUntil?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  tokensRemaining: number;
  capacity: number;
  resetMs: number;
}

export interface MetricsSummary {
  totalReceived: number;
  totalDelivered: number;
  totalRetrying: number;
  totalDLQ: number;
  successRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  circuitBreakerTrips: number;
}

// Zod schemas for runtime boundary validation
export const IngestEventSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destinationUrl: z.string().url("Must be a valid destination URL"),
  payload: z.record(z.unknown()),
  idempotencyKey: z.string().optional(),
  signature: z.string().optional(),
  maxRetries: z.number().int().min(0).max(10).optional().default(5),
});

export const ReplayEventSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  modifiedPayload: z.record(z.unknown()).optional(),
  destinationUrl: z.string().url().optional(),
});

export const CreateDestinationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  secret: z.string().optional(),
  failureThreshold: z.number().int().min(1).max(20).optional().default(3),
});
