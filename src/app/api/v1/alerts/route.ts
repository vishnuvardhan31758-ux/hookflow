import { NextRequest, NextResponse } from "next/server";
import {
  getAlertChannels,
  addAlertChannel,
  deleteAlertChannel,
  toggleAlertChannel,
  sendAlertNotification,
} from "@/lib/alerts";

export async function GET() {
  return NextResponse.json({ channels: getAlertChannels() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "test") {
      await sendAlertNotification(
        "Channel Connectivity Verification Ping",
        "This is an automated test alert from your HookFlow Enterprise Webhook Gateway. Channel connectivity verified successfully!",
        {
          eventId: "test_evt_verification_ok",
          source: "hookflow.system.healthcheck",
          status: "DELIVERED",
          destination: body.platform === "discord" ? "Discord Webhook API" : "Slack Incoming Webhook",
          attempts: 1,
          severity: "info",
        }
      );
      return NextResponse.json({ success: true, message: "Test alert dispatched." });
    }

    if (!body.name || !body.webhookUrl || !body.platform) {
      return NextResponse.json(
        { error: "Name, platform (discord/slack), and webhookUrl are required." },
        { status: 400 }
      );
    }

    const channel = addAlertChannel({
      name: body.name,
      platform: body.platform,
      webhookUrl: body.webhookUrl,
      enabled: body.enabled ?? true,
      notifyOnDlq: body.notifyOnDlq ?? true,
      notifyOnCircuitTrip: body.notifyOnCircuitTrip ?? true,
    });

    return NextResponse.json({ success: true, channel }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process alert channel" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, enabled } = await req.json();
    const updated = toggleAlertChannel(id, enabled);
    if (!updated) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, channel: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to toggle" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing channel id" }, { status: 400 });
    }
    const deleted = deleteAlertChannel(id);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete" },
      { status: 500 }
    );
  }
}
