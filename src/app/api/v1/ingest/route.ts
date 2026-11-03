import { NextRequest, NextResponse } from "next/server";
import { IngestEventSchema, WebhookEvent } from "@/lib/types";
import { globalRateLimiter } from "@/lib/rate-limiter";
import { verifyHmacSignature } from "@/lib/hmac";
import { globalIdempotencyEngine } from "@/lib/idempotency";
import { globalStore } from "@/lib/store";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // 1. Token-Bucket Rate Limiter Check
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "client_default";

  const rateCheck = globalRateLimiter.check(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: "RateLimitExceeded",
        message: "Too many incoming webhook events. Token bucket depleted.",
        tokensRemaining: rateCheck.tokensRemaining,
        capacity: rateCheck.capacity,
        resetMs: rateCheck.resetMs,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)),
          "X-RateLimit-Remaining": String(rateCheck.tokensRemaining),
        },
      }
    );
  }

  // 2. Parse Body and Validate Schema
  let rawBody: string;
  let json: unknown;
  try {
    rawBody = await req.text();
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "InvalidJSON", message: "Malformed JSON payload received." },
      { status: 400 }
    );
  }

  const parseResult = IngestEventSchema.safeParse(json);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "SchemaValidationError",
        issues: parseResult.error.format(),
      },
      { status: 422 }
    );
  }

  const { source, destinationUrl, payload, maxRetries } = parseResult.data;

  // 3. Cryptographic Signature Verification
  const incomingSignature =
    req.headers.get("x-hookflow-signature") ||
    req.headers.get("x-hub-signature-256") ||
    parseResult.data.signature;

  const defaultSecret = process.env.HOOKFLOW_DEFAULT_SECRET || "sec_wh_production_live_key_998877";

  if (incomingSignature) {
    const isValid =
      verifyHmacSignature(rawBody, incomingSignature, defaultSecret) ||
      verifyHmacSignature(payload, incomingSignature, defaultSecret);
    if (!isValid) {
      return NextResponse.json(
        {
          error: "UnauthorizedSignature",
          message: "HMAC-SHA256 signature verification failed. Tampered or unauthenticated payload.",
        },
        { status: 401 }
      );
    }
  }

  // 4. Idempotency Check
  const idempotencyKey =
    req.headers.get("idempotency-key") ||
    parseResult.data.idempotencyKey ||
    `idemp_${crypto.randomUUID()}`;

  const idempCheck = globalIdempotencyEngine.acquire(idempotencyKey, payload);

  if (idempCheck.isConflict) {
    return NextResponse.json(
      {
        error: "IdempotencyConflict",
        message: "An event with this Idempotency-Key already exists with a different payload.",
      },
      { status: 409 }
    );
  }

  if (idempCheck.isDuplicate && idempCheck.existingEventId) {
    const existing = globalStore.getEvent(idempCheck.existingEventId);
    return NextResponse.json(
      {
        status: "DEDUPLICATED",
        message: "Duplicate event detected via Idempotency-Key. Returned cached result.",
        event: existing,
      },
      { status: 200 }
    );
  }

  // 5. Construct Webhook Event Record
  const eventId = `evt_${crypto.randomUUID()}`;
  const now = Date.now();

  const event: WebhookEvent = {
    id: eventId,
    idempotencyKey,
    source,
    destinationUrl,
    payload,
    headers: {
      "X-Ingestion-Latency-Ms": String(Date.now() - startTime),
    },
    signature: incomingSignature || "unsigned_sandbox",
    status: "PENDING",
    retryCount: 0,
    maxRetries: maxRetries ?? 5,
    createdAt: now,
    updatedAt: now,
    attempts: [],
  };

  // 6. Persist & Register with Idempotency Engine
  globalStore.saveEvent(event);
  globalIdempotencyEngine.complete(idempotencyKey, eventId);

  // 7. Initiate Asynchronous Resilient Delivery
  // Fire and forget so client receives immediate 202 Accepted
  globalStore.dispatchEvent(event).catch((err) => {
    console.error(`[HookFlow] Delivery error for event ${eventId}:`, err);
  });

  return NextResponse.json(
    {
      status: "ACCEPTED",
      eventId: event.id,
      idempotencyKey: event.idempotencyKey,
      destinationUrl: event.destinationUrl,
      timestamp: event.createdAt,
      links: {
        status: `/api/v1/events/${event.id}`,
        replay: `/api/v1/replay`,
      },
    },
    {
      status: 202,
      headers: {
        "X-HookFlow-Event-Id": event.id,
        "X-RateLimit-Remaining": String(rateCheck.tokensRemaining),
      },
    }
  );
}
