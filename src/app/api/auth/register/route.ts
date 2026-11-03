import { NextRequest, NextResponse } from "next/server";
import { globalAuthService } from "@/lib/auth";
import { globalAuditLogService } from "@/lib/audit-logs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, organization } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "BadRequest", message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const { user, token } = globalAuthService.register(name, email, password, organization);

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    globalAuditLogService.record({
      action: "USER_REGISTER",
      actorEmail: user.email,
      actorRole: user.role,
      ipAddress: clientIp,
      details: `New engineering account registered for ${user.name} (${user.organization})`,
    });

    const response = NextResponse.json(
      {
        status: "SUCCESS",
        user,
        token,
      },
      { status: 201 }
    );

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
      { error: "RegistrationError", message: err instanceof Error ? err.message : "Registration failed." },
      { status: 400 }
    );
  }
}
