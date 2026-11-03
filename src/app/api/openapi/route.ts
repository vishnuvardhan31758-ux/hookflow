import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "HookFlow Distributed Event Ingestion & Dispatch API",
      version: "1.0.0",
      description:
        "Enterprise-grade resilient webhook ingestion engine featuring HMAC-SHA256 verification, token-bucket rate limiting, idempotency locks, circuit breakers, and automated DLQ recovery.",
      contact: {
        name: "HookFlow Engineering Team",
        url: "https://github.com",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "HookFlow v1 API Gateway",
      },
    ],
    paths: {
      "/ingest": {
        post: {
          summary: "Ingest incoming webhook event",
          description:
            "Validates HMAC signature, checks distributed token bucket, enforces idempotency, and queues resilient asynchronous delivery.",
          parameters: [
            {
              name: "X-HookFlow-Signature",
              in: "header",
              required: false,
              schema: { type: "string" },
              description: "HMAC-SHA256 signature of request payload",
            },
            {
              name: "Idempotency-Key",
              in: "header",
              required: false,
              schema: { type: "string" },
              description: "Unique transaction identifier to prevent duplicate processing",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["source", "destinationUrl", "payload"],
                  properties: {
                    source: { type: "string", example: "stripe.payment_intent.succeeded" },
                    destinationUrl: { type: "string", example: "https://api.myclient.com/webhooks" },
                    payload: { type: "object", example: { amount: 9900, currency: "eur", customer: "cus_8892" } },
                    idempotencyKey: { type: "string" },
                    maxRetries: { type: "integer", default: 5 },
                  },
                },
              },
            },
          },
          responses: {
            "202": { description: "Event accepted for resilient delivery" },
            "409": { description: "Conflict - Idempotency payload mismatch" },
            "429": { description: "Rate limit exceeded (Token Bucket exhausted)" },
            "401": { description: "Cryptographic signature verification failed" },
          },
        },
      },
      "/events": {
        get: {
          summary: "Query event ledger",
          parameters: [
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "source", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "List of webhook events with delivery attempts" },
          },
        },
      },
      "/replay": {
        post: {
          summary: "Replay failed webhook from DLQ",
          description: "Allows engineers to modify corrupted payload and trigger atomic redelivery.",
          responses: {
            "200": { description: "Event redelivery scheduled" },
          },
        },
      },
    },
  };

  return NextResponse.json(spec);
}
