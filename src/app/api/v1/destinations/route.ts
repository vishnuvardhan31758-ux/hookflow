import { NextRequest, NextResponse } from "next/server";
import { CreateDestinationSchema } from "@/lib/types";
import { globalStore } from "@/lib/store";
import { generateSecureSecret } from "@/lib/hmac";

export const dynamic = "force-dynamic";

export async function GET() {
  const destinations = globalStore.getDestinations();
  return NextResponse.json({
    count: destinations.length,
    destinations,
  });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "InvalidJSON", message: "Malformed JSON payload." },
      { status: 400 }
    );
  }

  const parsed = CreateDestinationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "SchemaValidationError", issues: parsed.error.format() },
      { status: 422 }
    );
  }

  const { name, url, secret, failureThreshold } = parsed.data;

  const created = globalStore.addDestination({
    name,
    url,
    secret: secret || generateSecureSecret(),
    enabled: true,
    failureThreshold: failureThreshold ?? 3,
  });

  return NextResponse.json(created, { status: 201 });
}
