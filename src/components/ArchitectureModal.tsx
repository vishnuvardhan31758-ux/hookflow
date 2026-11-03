"use client";

import React, { useState } from "react";
import { X, Layers, ShieldCheck, Cpu, Database, Network, GitPullRequest, Award } from "lucide-react";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"topology" | "adrs" | "academic">("topology");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between bg-gray-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-950 border border-sky-800 text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-base text-white">System Architecture & Engineering Specification</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  TU9 / German M.Sc. Standards
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Formal design patterns, distributed fault-tolerance, and architectural decision records.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 bg-gray-950/60 px-5 gap-2">
          <button
            onClick={() => setActiveTab("topology")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === "topology"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Distributed Topology</span>
          </button>
          <button
            onClick={() => setActiveTab("adrs")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === "adrs"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Architecture Decision Records (ADRs)</span>
          </button>
          <button
            onClick={() => setActiveTab("academic")}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === "academic"
                ? "border-sky-500 text-sky-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Master’s Academic Evaluation</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "topology" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-3">
                  High-Throughput Ingestion & Delivery Flowchart
                </h4>
                <div className="font-mono text-[11px] text-sky-300 bg-black/60 p-4 rounded-lg overflow-x-auto leading-relaxed border border-gray-800/80">
{`[EXTERNAL CLIENT]  (Stripe / GitHub / Shopify / Custom Webhook Senders)
       │
       ▼  POST /api/v1/ingest (Payload + HMAC Header + Idempotency-Key)
┌────────────────────────────────────────────────────────────────────────┐
│  HOOKFLOW EDGE INGESTION GATEWAY                                       │
│                                                                        │
│  [Step 1: Token-Bucket Limiter] ──> Exceeded? ──> 429 Too Many Requests│
│              │ (OK)                                                    │
│  [Step 2: HMAC-SHA256 Auth]    ──> Invalid?  ──> 401 Unauthorized      │
│              │ (OK)                                                    │
│  [Step 3: Idempotency Check]   ──> Duplicate?──> 200 Cached Result     │
│              │ (New Event)                                             │
│  [Step 4: Atomic Ledger Write] ──> Persist event state & metadata      │
│              │                                                         │
│  [Step 5: Immediate Return]    ──> 202 Accepted (Non-blocking async)   │
└──────────────┬─────────────────────────────────────────────────────────┘
               │
               ▼ Asynchronous Dispatch Queue
┌────────────────────────────────────────────────────────────────────────┐
│  RESILIENT DELIVERY ENGINE                                             │
│                                                                        │
│  [Circuit Breaker Check] ──> Circuit OPEN? ──> Mark CIRCUIT_BROKEN     │
│              │ (CLOSED / HALF-OPEN)                                    │
│  [HTTP Dispatch Worker]  ──> POST to Destination Endpoint              │
│              │                                                         │
│     ┌────────┴────────┐                                                │
│     ▼ (2xx Success)   ▼ (5xx or Timeout)                               │
│  [Mark DELIVERED]   [Exponential Backoff + Full Jitter]                │
│  [Reset Circuit]      ├── Retry < Max? ──> Sleep delay & Re-dispatch   │
│                       └── Retry >= Max?──> Escalate to DEAD-LETTER (DLQ)│
└────────────────────────────────────────────────────────────────────────┘
       │
       ▼ Real-Time Broadcast
[SERVER-SENT EVENTS (SSE) BROKER] ──> Live Cockpit Stream & Replay Studio`}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 text-xs">
                  <div className="flex items-center space-x-2 text-sky-400 font-semibold mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cryptographic Integrity</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Uses Node.js <code>crypto.timingSafeEqual</code> to reject tampered payloads without leaking execution timing side-channels.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 text-xs">
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
                    <Cpu className="w-4 h-4" />
                    <span>Fault Isolation</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    The Circuit Breaker pattern trips after consecutive downstream failures, protecting both sender memory and consumer infrastructure.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 text-xs">
                  <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-1">
                    <Database className="w-4 h-4" />
                    <span>State Convergence</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Dead-Letter Queue (DLQ) isolates unroutable payloads, permitting manual payload surgery and zero-data-loss redelivery.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "adrs" && (
            <div className="space-y-3">
              {/* ADR 1 */}
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sky-400">ADR-001: Token-Bucket vs Fixed-Window Rate Limiting</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px]">ACCEPTED</span>
                </div>
                <p className="text-gray-300 mt-1">
                  <strong>Context:</strong> Fixed-window algorithms suffer from traffic doubling at boundary transitions.
                </p>
                <p className="text-gray-400 mt-1">
                  <strong>Decision:</strong> Implemented Token-Bucket with continuous fractional token replenishment (`tokensToAdd = elapsedSeconds * refillRate`). Permits natural bursts up to capacity while enforcing hard long-term bounds.
                </p>
              </div>

              {/* ADR 2 */}
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sky-400">ADR-002: Exponential Backoff with Full Random Jitter</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px]">ACCEPTED</span>
                </div>
                <p className="text-gray-300 mt-1">
                  <strong>Context:</strong> When an upstream service recovers from downtime, synchronized retries cause a "Thundering Herd" retry storm that immediately knocks the service back down.
                </p>
                <p className="text-gray-400 mt-1">
                  <strong>Decision:</strong> Integrated AWS-style Full Jitter formula (`sleep = random_between(0.5 * base, min(cap, base * 2^attempt))`). Decorrelates retry traffic across clients.
                </p>
              </div>

              {/* ADR 3 */}
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sky-400">ADR-003: Server-Sent Events (SSE) vs WebSockets for Telemetry</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px]">ACCEPTED</span>
                </div>
                <p className="text-gray-300 mt-1">
                  <strong>Context:</strong> The engineering cockpit requires real-time log ingestion updates. WebSockets require stateful sticky TCP connections that break or time out on serverless/edge environments.
                </p>
                <p className="text-gray-400 mt-1">
                  <strong>Decision:</strong> Adopted standard HTTP/2 Server-Sent Events (`text/event-stream`). Provides native browser auto-reconnection, works effortlessly through firewalls and edge CDNs, and consumes zero idle compute.
                </p>
              </div>
            </div>
          )}

          {activeTab === "academic" && (
            <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-sm text-white mb-1">
                  How German Universities (TU9) Evaluate This System
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  German Computer Science and Software Engineering faculties (e.g. Technical University of Munich, RWTH Aachen, TU Berlin) look for engineering rigor over surface styling:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                  <strong className="text-sky-300">1. Distributed Systems & Fault Tolerance:</strong>
                  <p className="text-gray-400 mt-0.5">
                    Demonstrates implementation of Michael Nygard&apos;s Circuit Breaker state machine (CLOSED, OPEN, HALF_OPEN) and asynchronous queue decoupling.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                  <strong className="text-emerald-300">2. Security & European Privacy (GDPR):</strong>
                  <p className="text-gray-400 mt-0.5">
                    Constant-time HMAC cryptographic verification guarantees authenticity, while payload hashing ensures data integrity and prevention of duplicate credit/debit charges.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                  <strong className="text-indigo-300">3. Verification & CI/CD:</strong>
                  <p className="text-gray-400 mt-0.5">
                    Accompanied by 100% automated Vitest unit testing suites and GitHub Actions CI pipelines that enforce strict typing and code style on every commit.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex items-center justify-between text-xs text-gray-500">
          <span>HookFlow Architecture Specification v1.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
