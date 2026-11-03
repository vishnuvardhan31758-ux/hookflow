import { NextRequest, NextResponse } from "next/server";
import { globalStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = globalStore.getEvent(id);

  if (!event) {
    return NextResponse.json(
      { error: "NotFound", message: `Event ${id} does not exist.` },
      { status: 404 }
    );
  }

  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = globalStore.deleteEvent(id);

  if (!deleted) {
    return NextResponse.json(
      { error: "NotFound", message: `Event ${id} does not exist.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "DELETED",
    message: `Event ${id} removed.`,
  });
}
