import { NextRequest, NextResponse } from "next/server";
import { globalAuthService } from "@/lib/auth";
import { globalAuditLogService } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token =
    req.cookies.get("hookflow_session")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (token) {
    const user = globalAuthService.validateSession(token);
    if (user) {
      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      globalAuditLogService.record({
        action: "USER_LOGOUT",
        actorEmail: user.email,
        actorRole: user.role,
        ipAddress: clientIp,
        details: `User ${user.email} signed out`,
      });
    }
    globalAuthService.logout(token);
  }

  const response = NextResponse.json({ status: "LOGGED_OUT" });
  response.cookies.delete("hookflow_session");
  return response;
}
