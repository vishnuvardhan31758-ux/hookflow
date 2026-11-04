import { NextRequest, NextResponse } from "next/server";
import { generateHmacSignature } from "@/lib/hmac";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { scenario?: string; destinationUrl?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  const scenario = body.scenario || "stripe";
  const targetUrl = body.destinationUrl || `${baseUrl}/api/v1/mock-receiver?status=200`;
  const defaultSecret = process.env.HOOKFLOW_DEFAULT_SECRET || "sec_wh_production_live_key_998877";

  let source = "stripe.payment_intent.succeeded";
  let payload: Record<string, unknown> = {};

  if (scenario === "stripe") {
    source = "stripe.payment_intent.succeeded";
    payload = {
      id: `pi_${crypto.randomBytes(8).toString("hex")}`,
      amount: 4900,
      currency: "eur",
      customer: `cus_${crypto.randomBytes(6).toString("hex")}`,
      status: "succeeded",
      created: Math.floor(Date.now() / 1000),
      payment_method_types: ["card", "sepa_debit"],
    };
  } else if (scenario === "github") {
    source = "github.push";
    payload = {
      ref: "refs/heads/main",
      before: crypto.randomBytes(20).toString("hex"),
      after: crypto.randomBytes(20).toString("hex"),
      repository: {
        id: 928374,
        name: "hookflow-core",
        full_name: "tum-masters/hookflow-core",
      },
      pusher: {
        name: "dev-lead",
        email: "engineering@tum.de",
      },
      commits: [
        {
          id: crypto.randomBytes(20).toString("hex"),
          message: "feat(gateway): implement token-bucket continuous replenishment",
          author: { name: "Lead Engineer" },
        },
      ],
    };
  } else if (scenario === "shopify") {
    source = "shopify.orders.create";
    payload = {
      id: 8829104859,
      email: "berlin.buyer@example.de",
      total_price: "129.50",
      currency: "EUR",
      financial_status: "paid",
      line_items: [
        { title: "Mechanical Keyboard - Cherry MX Blue", quantity: 1, price: "129.50" },
      ],
    };
  } else if (scenario === "razorpay") {
    source = "razorpay.payment.authorized";
    payload = {
      payment_id: `pay_${crypto.randomBytes(7).toString("hex")}`,
      order_id: `order_${crypto.randomBytes(7).toString("hex")}`,
      amount: 149900,
      currency: "INR",
      method: "upi",
      email: "customer@corp.in",
      contact: "+919876543210",
      status: "authorized",
    };
  } else if (scenario === "twilio") {
    source = "twilio.sms.delivered";
    payload = {
      MessageSid: `SM${crypto.randomBytes(16).toString("hex")}`,
      MessageStatus: "delivered",
      To: "+14155552671",
      From: "+15017122661",
      ApiVersion: "2010-04-01",
    };
  } else if (scenario === "failing_500") {
    source = "billing.invoice.payment_failed";
    payload = {
      invoice_id: `inv_${crypto.randomBytes(6).toString("hex")}`,
      attempt_count: 1,
      subtotal: 850.0,
      currency: "EUR",
      error_code: "upstream_gateway_timeout",
    };
  } else if (scenario === "rate_limit_burst") {
    // Fire a burst of 12 events to demonstrate rate limiting
    const burstPromises = Array.from({ length: 12 }).map(async (_, idx) => {
      const burstPayload = {
        burstId: idx + 1,
        timestamp: Date.now(),
        event: "burst.test",
      };
      const signature = generateHmacSignature(burstPayload, defaultSecret);
      return fetch(`${baseUrl}/api/v1/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-HookFlow-Signature": signature,
          "Idempotency-Key": `burst_${Date.now()}_${idx}`,
        },
        body: JSON.stringify({
          source: "stress.load_test.event",
          destinationUrl: `${baseUrl}/api/v1/mock-receiver?status=200`,
          payload: burstPayload,
        }),
      }).then((r) => r.status);
    });

    const results = await Promise.all(burstPromises);
    const accepted = results.filter((s) => s === 202).length;
    const rateLimited = results.filter((s) => s === 429).length;

    return NextResponse.json({
      scenario: "rate_limit_burst",
      totalBurstEvents: results.length,
      accepted,
      rateLimited,
      statuses: results,
      message: `Fired 12 rapid events: ${accepted} accepted, ${rateLimited} throttled with HTTP 429 by Token-Bucket algorithm.`,
    });
  }

  // Single scenario dispatch to /api/v1/ingest
  const signature = generateHmacSignature(payload, defaultSecret);
  const idempotencyKey = `sim_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const ingestRes = await fetch(`${baseUrl}/api/v1/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-HookFlow-Signature": signature,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      source,
      destinationUrl: targetUrl,
      payload,
      idempotencyKey,
      maxRetries: 3,
    }),
  });

  const ingestData = await ingestRes.json();

  return NextResponse.json({
    status: "DISPATCHED",
    scenario,
    source,
    targetUrl,
    ingestResponse: ingestData,
    httpStatus: ingestRes.status,
  });
}
