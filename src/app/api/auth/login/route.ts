import { NextRequest, NextResponse } from "next/server";
import { globalAuthService } from "@/lib/auth";
import { globalAuditLogService } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = body.identifier || body.username || body.email;
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "BadRequest", message: "Username/email and password are required." },
        { status: 400 }
      );
    }

    const { user, token } = globalAuthService.login(identifier, password);

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    globalAuditLogService.record({
      action: "USER_LOGIN",
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: clientIp,
      details: `Successful authenticated session created for ${user.name} (@${user.username})`,
    });

    const response = NextResponse.json({
      status: "SUCCESS",
      user,
      token,
    });

    response.cookies.set("hookflow_session", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "AuthError", message: err instanceof Error ? err.message : "Authentication failed." },
      { status: 401 }
    );
  }
}
