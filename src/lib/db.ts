import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { WebhookEvent, WebhookDestination } from "./types";

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.NEXT_PRIVATE_DATABASE_URL ||
  "postgresql://neondb_owner:npg_Ein6cwbgq3Jv@ep-square-cell-bd64hvht-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require";

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getSql() {
  if (!sqlClient && databaseUrl) {
    try {
      sqlClient = neon(databaseUrl);
    } catch (err) {
      console.warn("[HookFlow DB] Failed to initialize Neon client:", err);
    }
  }
  return sqlClient;
}

export async function persistEventToDb(event: WebhookEvent): Promise<void> {
  const sql = getSql();
  if (!sql) return;

  try {
    await sql`
      INSERT INTO hookflow_events (
        id, source, destination_url, status, payload, headers, signature,
        idempotency_key, retry_count, max_retries, circuit_state, attempts,
        created_at, updated_at
      ) VALUES (
        ${event.id},
        ${event.source},
        ${event.destinationUrl},
        ${event.status},
        ${JSON.stringify(event.payload)},
        ${JSON.stringify(event.headers)},
        ${event.signature || ""},
        ${event.idempotencyKey || ""},
        ${event.retryCount || 0},
        ${event.maxRetries || 5},
        ${event.circuitStateAtDelivery || "CLOSED"},
        ${JSON.stringify(event.attempts || [])},
        ${event.createdAt},
        ${event.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        retry_count = EXCLUDED.retry_count,
        circuit_state = EXCLUDED.circuit_state,
        attempts = EXCLUDED.attempts,
        updated_at = EXCLUDED.updated_at;
    `;
  } catch (err) {
    console.warn("[HookFlow DB] Error persisting event to Neon:", err);
  }
}

export async function loadRecentEventsFromDb(limit = 100): Promise<WebhookEvent[]> {
  const sql = getSql();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, source, destination_url as "destinationUrl", status,
             payload, headers, signature, idempotency_key as "idempotencyKey",
             retry_count as "retryCount", max_retries as "maxRetries",
             circuit_state as "circuitStateAtDelivery", attempts,
             created_at as "createdAt", updated_at as "updatedAt"
      FROM hookflow_events
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;

    return rows.map((r) => ({
      id: r.id as string,
      source: r.source as string,
      destinationUrl: r.destinationUrl as string,
      status: r.status as any,
      payload: (typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload) || {},
      headers: (typeof r.headers === "string" ? JSON.parse(r.headers) : r.headers) || {},
      signature: r.signature as string,
      idempotencyKey: r.idempotencyKey as string,
      retryCount: Number(r.retryCount) || 0,
      maxRetries: Number(r.maxRetries) || 5,
      circuitStateAtDelivery: r.circuitStateAtDelivery as any,
      attempts: (typeof r.attempts === "string" ? JSON.parse(r.attempts) : r.attempts) || [],
      createdAt: Number(r.createdAt),
      updatedAt: Number(r.updatedAt),
    }));
  } catch (err) {
    console.warn("[HookFlow DB] Error loading events from Neon:", err);
    return [];
  }
}

export async function purgeAllEventsFromDb(): Promise<void> {
  const sql = getSql();
  if (!sql) return;

  try {
    await sql`TRUNCATE TABLE hookflow_events;`;
  } catch (err) {
    console.warn("[HookFlow DB] Error truncating hookflow_events:", err);
  }
}
