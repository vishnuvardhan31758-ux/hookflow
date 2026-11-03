"use client";

import React from "react";
import { MetricsSummary } from "@/lib/types";
import { CheckCircle2, Clock, AlertTriangle, Zap, Server, ShieldAlert } from "lucide-react";

interface MetricsOverviewProps {
  metrics: MetricsSummary;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Ingested */}
      <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800 shadow-sm hover:border-gray-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Total Ingested</span>
          <Server className="w-4 h-4 text-sky-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">
            {metrics.totalReceived}
          </span>
          <span className="text-[11px] text-gray-500">events</span>
        </div>
        <div className="mt-1 text-[11px] text-sky-400 font-mono">100% Ingestion QoS</div>
      </div>

      {/* 2. Delivered / Success Rate */}
      <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800 shadow-sm hover:border-gray-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Delivered</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {metrics.totalDelivered}
          </span>
          <span className="text-[11px] text-gray-400">({metrics.successRate}%)</span>
        </div>
        <div className="mt-1 text-[11px] text-emerald-500 font-mono">2xx HTTP Confirmed</div>
      </div>

      {/* 3. Retrying (Exponential Backoff) */}
      <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800 shadow-sm hover:border-gray-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Active Retries</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-amber-400">
            {metrics.totalRetrying}
          </span>
          <span className="text-[11px] text-gray-500">in-flight</span>
        </div>
        <div className="mt-1 text-[11px] text-amber-500 font-mono">Exponential Jitter</div>
      </div>

      {/* 4. Dead-Letter Queue (DLQ) */}
      <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800 shadow-sm hover:border-gray-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">DLQ Isolated</span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-rose-400">
            {metrics.totalDLQ}
          </span>
          <span className="text-[11px] text-gray-500">failed</span>
        </div>
        <div className="mt-1 text-[11px] text-rose-500 font-mono">1-Click Replayable</div>
      </div>

      {/* 5. Latency Profile (P95) */}
      <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800 shadow-sm hover:border-gray-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">P95 Latency</span>
          <Zap className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-indigo-300">
            {metrics.p95LatencyMs}
          </span>
          <span className="text-[11px] text-gray-500">ms</span>
        </div>
        <div className="mt-1 text-[11px] text-indigo-400 font-mono">Avg: {metrics.avgLatencyMs}ms</div>
      </div>

      {/* 6. Circuit Breaker Trips */}
      <div className="p-4 rounded-xl bg-gray-900/70 border border-gray-800 shadow-sm hover:border-gray-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Circuit Trips</span>
          <ShieldAlert className="w-4 h-4 text-purple-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-purple-400">
            {metrics.circuitBreakerTrips}
          </span>
          <span className="text-[11px] text-gray-500">trips</span>
        </div>
        <div className="mt-1 text-[11px] text-purple-400 font-mono">Cascading Guard</div>
      </div>
    </div>
  );
};
