"use client";

import React, { useState } from "react";
import { WebhookDestination } from "@/lib/types";
import {
  Server,
  Zap,
  Plus,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from "lucide-react";

interface DestinationManagerProps {
  destinations: WebhookDestination[];
  onRefresh: () => void;
}

export const DestinationManager: React.FC<DestinationManagerProps> = ({
  destinations,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [threshold, setThreshold] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCircuit = async (destId: string) => {
    await fetch(`/api/v1/destinations/${destId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetCircuit: true }),
    });
    onRefresh();
  };

  return (
    <div className="rounded-2xl bg-gray-900/80 border border-gray-800 shadow-lg p-4 sm:p-5">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-white">
            Consumer Endpoints & Circuit Breakers
          </h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Destination</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {destinations.map((dest) => {
          const isCircuitOpen = dest.circuitState === "OPEN";
          const isHalfOpen = dest.circuitState === "HALF_OPEN";

          return (
            <div
              key={dest.id}
              className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                isCircuitOpen
                  ? "bg-rose-950/20 border-rose-900/60"
                  : isHalfOpen
                  ? "bg-amber-950/20 border-amber-900/60"
                  : "bg-gray-950/60 border-gray-800 hover:border-gray-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-gray-200 truncate">
                    {dest.name}
                  </span>
                  {/* Circuit Pill */}
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

                <div className="mt-2 text-[11px] font-mono text-gray-400 truncate">
                  {dest.url}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-800/80 pt-2">
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
                  <div className="flex items-center space-x-1 text-sky-400 font-mono text-[10px]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>HMAC</span>
                  </div>
                </div>
              </div>

              {isCircuitOpen && (
                <div className="mt-3 pt-2 border-t border-rose-900/40 flex items-center justify-between">
                  <span className="text-[10px] text-rose-400 font-mono">
                    Tripped (Failing Fast)
                  </span>
                  <button
                    onClick={() => resetCircuit(dest.id)}
                    className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-medium rounded bg-rose-900/60 hover:bg-rose-900 text-rose-200 transition"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl p-5">
            <h3 className="font-semibold text-sm text-white mb-3">
              Add Webhook Destination
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
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
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-gray-950 border border-gray-700 text-gray-200 focus:outline-none focus:border-sky-500"
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
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-gray-950 border border-gray-700 text-gray-200 font-mono focus:outline-none focus:border-sky-500"
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
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-gray-950 border border-gray-700 text-gray-200 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white"
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
