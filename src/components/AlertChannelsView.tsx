"use client";

import React, { useState, useEffect } from "react";
import { AlertChannel } from "@/lib/alerts";
import { useToast } from "@/context/ToastContext";
import {
  Bell,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export const AlertChannelsView: React.FC = () => {
  const { showToast } = useToast();
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<"discord" | "slack">("discord");
  const [webhookUrl, setWebhookUrl] = useState("");

  const loadChannels = async () => {
    try {
      const res = await fetch("/api/v1/alerts");
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !webhookUrl.trim()) {
      showToast("Please fill in channel name and webhook URL.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, platform, webhookUrl }),
      });

      if (res.ok) {
        showToast("Alert channel configured successfully!", "success");
        setName("");
        setWebhookUrl("");
        setIsCreating(false);
        loadChannels();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create channel", "error");
      }
    } catch {
      showToast("Network error creating channel", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTestPing = async (channel: AlertChannel) => {
    setTestingId(channel.id);
    try {
      const res = await fetch("/api/v1/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", platform: channel.platform }),
      });

      if (res.ok) {
        showToast(`Verification ping dispatched to ${channel.name}!`, "success");
      } else {
        showToast("Failed to dispatch test notification.", "error");
      }
    } catch {
      showToast("Error sending test alert.", "error");
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/alerts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Alert channel deleted.", "info");
        setChannels((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      showToast("Failed to delete channel.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-900/30 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Bell className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Incident Alerting Channels (Discord & Slack)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Receive immediate, high-priority incident notifications directly in your team&apos;s Discord server or Slack workspace whenever an event exhausts retries into the DLQ or a downstream circuit breaker trips to OPEN.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-medium shadow-md transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreating ? "Cancel" : "Add Notification Channel"}</span>
          </button>
        </div>

        {/* Create Form Modal / Drawer */}
        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4 animate-in fade-in"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Channel Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., #eng-incident-alerts"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as "discord" | "slack")}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="discord">Discord Webhook</option>
                  <option value="slack">Slack Incoming Webhook</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  placeholder={
                    platform === "discord"
                      ? "https://discord.com/api/webhooks/..."
                      : "https://hooks.slack.com/services/..."
                  }
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Alerts automatically include event ID, source, HTTP status code, and delivery retry count.
              </span>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition disabled:opacity-50"
              >
                {loading ? "Connecting..." : "Save Channel"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Channels List */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Configured Alert Channels ({channels.length})
            </h3>
          </div>
        </div>

        {channels.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-400" />
            <p className="text-sm font-medium text-slate-300">No alert channels configured</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Add a Discord or Slack Webhook to receive instant push alerts whenever events are quarantined into the Dead-Letter Queue or downstream circuit breakers trip.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition"
              >
                <div className="flex items-start space-x-3">
                  <span
                    className={`p-2 rounded-xl text-xs font-bold uppercase ${
                      ch.platform === "discord"
                        ? "bg-indigo-950 text-indigo-400 border border-indigo-800/50"
                        : "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                    }`}
                  >
                    {ch.platform}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-200">
                        {ch.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Active
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate max-w-sm sm:max-w-md">
                      {ch.webhookUrl.slice(0, 35)}...
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => handleTestPing(ch)}
                    disabled={testingId === ch.id}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${testingId === ch.id ? "animate-spin" : ""}`} />
                    <span>{testingId === ch.id ? "Pinging..." : "Test Ping"}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(ch.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                    title="Delete channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <span>How to get Discord Webhook:</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            1. Open Discord $\rightarrow$ Right-click your channel $\rightarrow$ **Edit Channel**.<br />
            2. Go to **Integrations** $\rightarrow$ **Webhooks** $\rightarrow$ Click **New Webhook**.<br />
            3. Copy the URL and paste it above!
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>How to get Slack Webhook:</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            1. Go to **api.slack.com/apps** $\rightarrow$ Create an app.<br />
            2. Enable **Incoming Webhooks** $\rightarrow$ Click **Add New Webhook to Workspace**.<br />
            3. Select your incident channel and copy the URL!
          </p>
        </div>
      </div>
    </div>
  );
};
