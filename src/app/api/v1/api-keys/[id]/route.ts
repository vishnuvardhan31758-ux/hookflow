import { NextRequest, NextResponse } from "next/server";
import { globalApiKeyService } from "@/lib/api-keys";
import { globalAuditLogService } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const revoked = globalApiKeyService.revokeKey(id);

  if (!revoked) {
    return NextResponse.json({ error: "NotFound", message: "Key not found" }, { status: 404 });
  }

  globalAuditLogService.record({
    action: "API_KEY_REVOKED",
    actorEmail: "admin@hookflow.io",
    actorRole: "ADMIN",
    ipAddress: "127.0.0.1",
    details: `Revoked API key ${id}`,
  });

  return NextResponse.json({ status: "REVOKED", id });
}
