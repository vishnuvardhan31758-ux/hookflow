import { NextRequest, NextResponse } from "next/server";
import { globalStore } from "@/lib/store";
import { EventStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") as EventStatus) || undefined;
  const source = searchParams.get("source") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const events = globalStore.getEvents({ status, source, limit });
  const metrics = globalStore.getMetrics();

  return NextResponse.json({
    count: events.length,
    metrics,
    events,
  });
}

export async function DELETE() {
  globalStore.clearAll();
  return NextResponse.json({
    status: "CLEARED",
    message: "Event ledger successfully purged.",
  });
}
