"use client";

import React, { useState } from "react";
import { WebhookEvent } from "@/lib/types";
import { X, Copy, Check, Clock, RotateCcw, ShieldCheck, Terminal } from "lucide-react";

interface EventDetailsDrawerProps {
  event: WebhookEvent | null;
  onClose: () => void;
  onOpenReplay: (event: WebhookEvent) => void;
}

export const EventDetailsDrawer: React.FC<EventDetailsDrawerProps> = ({
  event,
  onClose,
  onOpenReplay,
}) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(event.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950">
        <div>
          <span className="text-xs font-mono text-sky-400">EVENT INSPECTOR</span>
          <h3 className="font-bold text-sm text-white truncate">{event.source}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {(event.status === "FAILED_DLQ" || event.status === "CIRCUIT_BROKEN") && (
            <button
              onClick={() => onOpenReplay(event)}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Replay</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Metadata Card */}
        <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Event ID:</span>
            <span className="font-mono text-gray-200">{event.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Idempotency-Key:</span>
            <span className="font-mono text-sky-400 truncate max-w-[260px]">
              {event.idempotencyKey}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Destination:</span>
            <span className="font-mono text-gray-300 truncate max-w-[260px]">
              {event.destinationUrl}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">HMAC-SHA256:</span>
            <div className="flex items-center space-x-1 font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[200px]">{event.signature}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Timestamp:</span>
            <span className="font-mono text-gray-400">
              {new Date(event.createdAt).toISOString()}
            </span>
          </div>
        </div>

        {/* Delivery Attempt History Timeline */}
        <div>
          <div className="flex items-center space-x-1.5 mb-2.5">
            <Clock className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
              Delivery Attempt Timeline ({event.attempts.length})
            </h4>
          </div>

          <div className="space-y-2">
            {event.attempts.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3 bg-gray-950/60 rounded-lg">
                No delivery attempts recorded yet. Ingestion pending.
              </p>
            ) : (
              event.attempts.map((att) => {
                const isSuccess = att.statusCode && att.statusCode >= 200 && att.statusCode < 300;
                return (
                  <div
                    key={att.id}
                    className={`p-3 rounded-xl border text-xs ${
                      isSuccess
                        ? "bg-emerald-950/20 border-emerald-900/50"
                        : "bg-rose-950/20 border-rose-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-200">
                        Attempt #{att.attemptNumber}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isSuccess ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        HTTP {att.statusCode || "TIMEOUT"}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Latency: {att.durationMs}ms</span>
                      <span>{new Date(att.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {att.nextRetryTimestamp && (
                      <div className="mt-1.5 text-[11px] text-amber-400 font-mono">
                        Exponential Backoff: Next retry scheduled in{" "}
                        {Math.max(0, Math.round((att.nextRetryTimestamp - att.timestamp) / 1000))}s
                      </div>
                    )}

                    {att.responseBody && (
                      <div className="mt-2 p-2 rounded bg-gray-950 border border-gray-800 text-[11px] font-mono text-gray-300 break-all max-h-24 overflow-y-auto">
                        {att.responseBody}
                      </div>
                    )}

                    {att.error && (
                      <div className="mt-1 text-[11px] text-rose-400 font-mono">
                        Error: {att.error}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* JSON Payload Inspector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                Event Payload (JSON)
              </h4>
            </div>
            <button
              onClick={copyPayload}
              className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <pre className="p-3 rounded-xl bg-gray-950 border border-gray-800 text-[11px] font-mono text-sky-300 overflow-x-auto max-h-64 leading-relaxed">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
