import { NextRequest, NextResponse } from "next/server";
import { generateHmacSignature, verifyHmacSignature } from "@/lib/hmac";

export async function POST(req: NextRequest) {
  try {
    const { payload, secret, testSignature } = await req.json();

    const actualSecret = secret || process.env.HOOKFLOW_DEFAULT_SECRET || "sec_wh_production_live_key_998877";
    const signature = generateHmacSignature(payload || {}, actualSecret);

    let isValid: boolean | null = null;
    if (testSignature) {
      isValid = verifyHmacSignature(payload || {}, testSignature, actualSecret);
    }

    return NextResponse.json({
      signature,
      algorithm: "HMAC-SHA256",
      isValid,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate HMAC" },
      { status: 500 }
    );
  }
}
