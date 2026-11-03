"use client";

import React, { useState } from "react";
import { WebhookDestination } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import {
  Server,
  Zap,
  Plus,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Send,
  Copy,
  Trash2,
} from "lucide-react";

interface DestinationManagerProps {
  destinations: WebhookDestination[];
  onRefresh: () => void;
}

export const DestinationManager: React.FC<DestinationManagerProps> = ({
  destinations,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [threshold, setThreshold] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pingingId, setPingingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, failureThreshold: threshold }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setName("");
        setUrl("");
        onRefresh();
        showToast("Webhook endpoint registered successfully!", "success");
      }
    } catch {
      showToast("Failed to create destination.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestPing = async (dest: WebhookDestination) => {
    setPingingId(dest.id);
    try {
      const res = await fetch("/api/v1/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: "stripe",
          destinationUrl: dest.url,
        }),
      });

      if (res.ok) {
        showToast(`Test ping dispatched to '${dest.name}'!`, "success");
        onRefresh();
      } else {
        showToast("Test ping failed.", "error");
      }
    } catch {
      showToast("Network error during test ping.", "error");
    } finally {
      setPingingId(null);
    }
  };

  const resetCircuit = async (destId: string) => {
    await fetch(`/api/v1/destinations/${destId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetCircuit: true }),
    });
    onRefresh();
    showToast("Circuit breaker reset to CLOSED.", "info");
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    showToast("HMAC secret copied to clipboard!", "success");
  };

  return (
    <div className="rounded-2xl bg-gray-900/80 border border-gray-800 shadow-lg p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">
              Consumer Endpoints & Circuit Breakers
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Registered webhook consumers protected with Michael Nygard&apos;s Circuit Breaker state machine.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Endpoint</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {destinations.map((dest) => {
          const isCircuitOpen = dest.circuitState === "OPEN";
          const isHalfOpen = dest.circuitState === "HALF_OPEN";
          const isPinging = pingingId === dest.id;

          return (
            <div
              key={dest.id}
              className={`p-4 rounded-xl border transition flex flex-col justify-between shadow-sm ${
                isCircuitOpen
                  ? "bg-rose-950/20 border-rose-900/60 shadow-rose-950/20"
                  : isHalfOpen
                  ? "bg-amber-950/20 border-amber-900/60 shadow-amber-950/20"
                  : "bg-gray-950/60 border-gray-800 hover:border-gray-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-gray-100 truncate">
                    {dest.name}
                  </span>
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isCircuitOpen
                        ? "bg-rose-950 text-rose-400 border border-rose-800"
                        : isHalfOpen
                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                        : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    }`}
                  >
                    {isCircuitOpen ? (
                      <AlertTriangle className="w-3 h-3 mr-0.5" />
                    ) : isHalfOpen ? (
                      <Radio className="w-3 h-3 mr-0.5 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 mr-0.5" />
                    )}
                    {dest.circuitState}
                  </span>
                </div>

                <div className="mt-2 text-[11px] font-mono text-gray-400 truncate bg-gray-900/80 p-1.5 rounded border border-gray-800">
                  {dest.url}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>
                    Failures:{" "}
                    <span
                      className={`font-mono font-bold ${
                        dest.consecutiveFailures > 0 ? "text-rose-400" : "text-gray-400"
                      }`}
                    >
                      {dest.consecutiveFailures}/{dest.failureThreshold}
                    </span>
                  </span>

                  <button
                    onClick={() => copySecret(dest.secret)}
                    className="flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-mono text-[10px] transition"
                    title="Copy HMAC Secret"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Copy Secret</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                <button
                  onClick={() => handleTestPing(dest)}
                  disabled={isPinging}
                  className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition disabled:opacity-50"
                >
                  <Send className={`w-3 h-3 text-sky-400 ${isPinging ? "animate-pulse" : ""}`} />
                  <span>{isPinging ? "Pinging..." : "Test Ping"}</span>
                </button>

                {isCircuitOpen && (
                  <button
                    onClick={() => resetCircuit(dest.id)}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-900/80 hover:bg-rose-900 text-rose-200 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Circuit</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-sm text-white mb-3">
              Register Webhook Destination
            </h3>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Destination Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Analytics Pipeline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-gray-950 border border-gray-800 text-gray-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Destination Endpoint URL
                </label>
                <input
                  type="url"
                  placeholder="https://api.domain.com/webhooks"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-gray-950 border border-gray-800 text-gray-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Circuit Failure Threshold
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-gray-950 border border-gray-800 text-gray-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-400 text-gray-950 shadow"
                >
                  {isSubmitting ? "Saving..." : "Add Destination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
