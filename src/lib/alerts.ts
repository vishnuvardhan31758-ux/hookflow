import { WebhookEvent } from "./types";
import { getSql } from "./db";
import crypto from "crypto";

export interface AlertChannel {
  id: string;
  name: string;
  platform: "discord" | "slack";
  webhookUrl: string;
  enabled: boolean;
  notifyOnDlq: boolean;
  notifyOnCircuitTrip: boolean;
  createdAt: number;
}

// In-memory registry with fallback defaults
let alertChannels: AlertChannel[] = [];

export function getAlertChannels(): AlertChannel[] {
  return alertChannels;
}

export function addAlertChannel(data: Omit<AlertChannel, "id" | "createdAt">): AlertChannel {
  const channel: AlertChannel = {
    ...data,
    id: `alert_${crypto.randomBytes(6).toString("hex")}`,
    createdAt: Date.now(),
  };
  alertChannels.push(channel);
  return channel;
}

export function deleteAlertChannel(id: string): boolean {
  const initialLen = alertChannels.length;
  alertChannels = alertChannels.filter((c) => c.id !== id);
  return alertChannels.length < initialLen;
}

export function toggleAlertChannel(id: string, enabled: boolean): AlertChannel | undefined {
  const ch = alertChannels.find((c) => c.id === id);
  if (ch) {
    ch.enabled = enabled;
  }
  return ch;
}

/**
 * Dispatches notification to configured Discord or Slack endpoints
 */
export async function sendAlertNotification(
  title: string,
  message: string,
  meta?: {
    eventId?: string;
    source?: string;
    status?: string;
    destination?: string;
    attempts?: number;
    severity?: "warning" | "danger" | "info";
  }
): Promise<void> {
  const activeChannels = alertChannels.filter((c) => c.enabled);
  if (activeChannels.length === 0) return;

  const color =
    meta?.severity === "danger"
      ? 15158332 // Red
      : meta?.severity === "warning"
      ? 16753920 // Orange
      : 3447003; // Blue

  for (const channel of activeChannels) {
    try {
      if (channel.platform === "discord") {
        await fetch(channel.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [
              {
                title: `🛡️ HookFlow Alert: ${title}`,
                description: message,
                color,
                fields: [
                  ...(meta?.eventId
                    ? [{ name: "Event ID", value: `\`${meta.eventId}\``, inline: true }]
                    : []),
                  ...(meta?.source
                    ? [{ name: "Source", value: `\`${meta.source}\``, inline: true }]
                    : []),
                  ...(meta?.status
                    ? [{ name: "Status", value: `**${meta.status}**`, inline: true }]
                    : []),
                  ...(meta?.destination
                    ? [{ name: "Destination", value: `\`${meta.destination}\``, inline: false }]
                    : []),
                  ...(meta?.attempts !== undefined
                    ? [{ name: "Attempts", value: `${meta.attempts}`, inline: true }]
                    : []),
                ],
                footer: {
                  text: "HookFlow Enterprise Gateway • Zero Data Loss",
                },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      } else if (channel.platform === "slack") {
        await fetch(channel.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `*🚨 HookFlow Alert: ${title}*\n>${message}\n*Event:* \`${meta?.eventId || "N/A"}\` | *Source:* \`${meta?.source || "N/A"}\` | *Status:* ${meta?.status || "N/A"}`,
          }),
        });
      }
    } catch (err) {
      console.warn(`[HookFlow Alerts] Failed to deliver to ${channel.platform}:`, err);
    }
  }
}
