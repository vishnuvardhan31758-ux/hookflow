"use client";

import React, { useState } from "react";
import { WebhookEvent } from "@/lib/types";
import { X, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";

interface ReplayModalProps {
  event: WebhookEvent | null;
  onClose: () => void;
  onReplayed: () => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  event,
  onClose,
  onReplayed,
}) => {
  const [payloadText, setPayloadText] = useState(() =>
    event ? JSON.stringify(event.payload, null, 2) : ""
  );
  const [destinationUrl, setDestinationUrl] = useState(() => event?.destinationUrl || "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!event) return null;

  const handleReplay = async () => {
    setError(null);
    let parsedPayload: Record<string, unknown>;

    try {
      parsedPayload = JSON.parse(payloadText);
    } catch {
      setError("Payload must be valid JSON.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          modifiedPayload: parsedPayload,
          destinationUrl: destinationUrl !== event.destinationUrl ? destinationUrl : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Replay failed");
      }

      setSuccess(true);
      setTimeout(() => {
        onReplayed();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Replay dispatch failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <h3 className="font-semibold text-sm text-white">Dead-Letter Queue (DLQ) Replay Studio</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-400">
            Re-drive this isolated event back into the worker pipeline. You can modify the destination URL or edit the JSON payload to fix corrupted properties before redelivery.
          </p>

          {error && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Event redriven successfully! Re-queued in pipeline.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Destination URL
            </label>
            <input
              type="url"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-gray-950 border border-gray-700 text-gray-200 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Edit Payload (JSON)
            </label>
            <textarea
              rows={8}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full p-3 text-xs rounded-lg bg-gray-950 border border-gray-700 text-sky-300 font-mono focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/60 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReplay}
            disabled={isSubmitting || success}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
            <span>{isSubmitting ? "Dispatching..." : "Execute Replay"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
