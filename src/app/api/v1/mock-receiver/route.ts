import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") || "200";
  const delayParam = searchParams.get("delay");

  if (delayParam) {
    const delayMs = parseInt(delayParam, 10);
    if (!isNaN(delayMs) && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 4000)));
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = { received: true };
  }

  const statusCode = parseInt(statusParam, 10) || 200;

  if (statusCode >= 400) {
    return NextResponse.json(
      {
        error: "SimulatedConsumerFailure",
        simulatedStatus: statusCode,
        message: `Consumer endpoint simulated failure with HTTP ${statusCode}`,
        receivedAt: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }

  return NextResponse.json(
    {
      success: true,
      simulatedStatus: 200,
      message: "Webhook successfully ingested by target consumer.",
      timestamp: Date.now(),
      payloadEcho: body,
    },
    { status: 200 }
  );
}
