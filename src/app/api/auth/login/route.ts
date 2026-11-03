import { NextRequest, NextResponse } from "next/server";
import { globalAuthService } from "@/lib/auth";
import { globalAuditLogService } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "BadRequest", message: "Email and password are required." },
        { status: 400 }
      );
    }

    const { user, token } = globalAuthService.login(email, password);

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    globalAuditLogService.record({
      action: "USER_LOGIN",
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: clientIp,
      details: `Successful authenticated session created for ${user.name}`,
    });

    const response = NextResponse.json({
      status: "SUCCESS",
      user,
      token,
    });

    // Set HTTP-only session cookie
    response.cookies.set("hookflow_session", token, {
      httpOnly: false, // Accessible to client auth provider
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
