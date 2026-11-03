import { NextRequest, NextResponse } from "next/server";
import { globalStore } from "@/lib/store";
import { globalCircuitRegistry } from "@/lib/circuit-breaker";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is acceptable for reset
  }

  // Support resetting circuit breaker
  if (body.resetCircuit === true) {
    const cb = globalCircuitRegistry.get(id);
    cb.reset();
  }

  const updated = globalStore.updateDestination(id, body);
  if (!updated) {
    return NextResponse.json({ error: "NotFound" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = globalStore.deleteDestination(id);

  if (!deleted) {
    return NextResponse.json({ error: "NotFound" }, { status: 404 });
  }

  return NextResponse.json({ status: "DELETED", id });
}
