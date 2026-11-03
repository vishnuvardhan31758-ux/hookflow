import { NextRequest, NextResponse } from "next/server";
import { ReplayEventSchema } from "@/lib/types";
import { globalStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "InvalidJSON", message: "Malformed JSON payload." },
      { status: 400 }
    );
  }

  const parsed = ReplayEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "SchemaValidationError", issues: parsed.error.format() },
      { status: 422 }
    );
  }

  const { eventId, modifiedPayload, destinationUrl } = parsed.data;
  const existing = globalStore.getEvent(eventId);

  if (!existing) {
    return NextResponse.json(
      { error: "NotFound", message: `Event ${eventId} not found.` },
      { status: 404 }
    );
  }

  // Update event properties for re-drive
  if (modifiedPayload) {
    existing.payload = modifiedPayload;
  }
  if (destinationUrl) {
    existing.destinationUrl = destinationUrl;
  }

  existing.status = "PROCESSING";
  existing.retryCount = 0;
  existing.updatedAt = Date.now();
  globalStore.saveEvent(existing);

  // Re-dispatch asynchronously
  globalStore.dispatchEvent(existing).catch((err) => {
    console.error(`[HookFlow] Replay error for ${eventId}:`, err);
  });

  return NextResponse.json({
    status: "REPLAY_DISPATCHED",
    message: `Event ${eventId} successfully redriven into delivery pipeline.`,
    event: existing,
  });
}
