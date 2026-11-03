import { NextRequest, NextResponse } from "next/server";
import { globalApiKeyService } from "@/lib/api-keys";
import { globalAuditLogService } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

export async function GET() {
  const keys = globalApiKeyService.getKeys();
  return NextResponse.json({ count: keys.length, keys });
}

export async function POST(req: NextRequest) {
  try {
    const { name, environment, scopes } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "BadRequest", message: "API key name is required." },
        { status: 400 }
      );
    }

    const created = globalApiKeyService.generateKey({
      name,
      environment: environment || "production",
      scopes: scopes || ["events:write", "events:read"],
    });

    globalAuditLogService.record({
      action: "API_KEY_CREATED",
      actorEmail: "admin@hookflow.io",
      actorRole: "ADMIN",
      ipAddress: "127.0.0.1",
      details: `Generated new API key '${created.name}' (${created.environment}) with prefix ${created.keyPrefix}`,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "CreationError", message: err instanceof Error ? err.message : "Failed to generate key." },
      { status: 400 }
    );
  }
}
