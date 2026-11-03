import { NextResponse } from "next/server";
import { globalAuditLogService } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

export async function GET() {
  const logs = globalAuditLogService.getLogs(50);
  return NextResponse.json({ count: logs.length, logs });
}
