"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WebhookEvent, WebhookDestination, MetricsSummary } from "@/lib/types";
import { Navbar, NavTab } from "@/components/Navbar";
import { MetricsOverview } from "@/components/MetricsOverview";
import { WebhookSimulator } from "@/components/WebhookSimulator";
import { LiveEventStream } from "@/components/LiveEventStream";
import { EventDetailsDrawer } from "@/components/EventDetailsDrawer";
import { DestinationManager } from "@/components/DestinationManager";
import { ReplayModal } from "@/components/ReplayModal";
import { ArchitectureModal } from "@/components/ArchitectureModal";
import { ApiKeysView } from "@/components/ApiKeysView";
import { AuditLogsView } from "@/components/AuditLogsView";
import { AlertChannelsView } from "@/components/AlertChannelsView";
import { HmacStudio } from "@/components/HmacStudio";
import { useToast } from "@/context/ToastContext";
import { Database, ShieldCheck, Cpu, Github, ExternalLink, Zap } from "lucide-react";

const initialMetrics: MetricsSummary = {
  totalReceived: 0,
  totalDelivered: 0,
  totalRetrying: 0,
  totalDLQ: 0,
  successRate: 100,
  avgLatencyMs: 0,
  p95LatencyMs: 0,
  circuitBreakerTrips: 0,
};

export default function Home() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<NavTab>("cockpit");
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [destinations, setDestinations] = useState<WebhookDestination[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary>(initialMetrics);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [replayEvent, setReplayEvent] = useState<WebhookEvent | null>(null);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all initial data
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [eventsRes, destsRes] = await Promise.all([
        fetch("/api/v1/events?limit=100"),
        fetch("/api/v1/destinations"),
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
        if (data.metrics) setMetrics(data.metrics);
      }

      if (destsRes.ok) {
        const destData = await destsRes.json();
        setDestinations(destData.destinations || []);
      }
    } catch (err) {
      console.error("[HookFlow] Load error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Connect to live Server-Sent Events stream
  useEffect(() => {
    loadData();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/v1/sse");

      eventSource.addEventListener("event_updated", (e) => {
        try {
          const updatedEvent: WebhookEvent = JSON.parse(e.data);
          setEvents((prev) => {
            const index = prev.findIndex((ev) => ev.id === updatedEvent.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = updatedEvent;
              return copy;
            }
            return [updatedEvent, ...prev];
          });
          loadData();
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      });

      eventSource.addEventListener("event_deleted", (e) => {
        try {
          const { id } = JSON.parse(e.data);
          setEvents((prev) => prev.filter((ev) => ev.id !== id));
        } catch (err) {
          console.error("SSE delete error:", err);
        }
      });
    } catch (err) {
      console.warn("SSE connection error:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [loadData]);

  const handleClearAll = async () => {
    await fetch("/api/v1/events", { method: "DELETE" });
    setEvents([]);
    setSelectedEvent(null);
    showToast("Event ledger purged from memory & Neon PostgreSQL.", "info");
    loadData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onRefresh={() => {
          loadData();
          showToast("Telemetry & database reloaded.", "info");
        }}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cockpit / Overview Tab */}
        {activeTab === "cockpit" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Executive Hero Banner */}
            <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0d121f] to-slate-950 border border-slate-800 shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Enterprise Distributed Webhook Engine
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Neon PostgreSQL Connected (AWS us-east-2)</span>
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 flex items-center space-x-1">
                      <span>Architect: Vishnu Vardhan</span>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
                    HookFlow Ingestion Gateway & Fault-Tolerant Delivery Engine
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
                    Zero-Data-Loss event gateway providing RFC-compliant Idempotency (preventing double-spend mutations), token-bucket rate limiting, 3-state Circuit Breakers, and exponential backoff with full random jitter to prevent Thundering Herd cascading outages.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setActiveTab("alerts")}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-900/40 shadow-sm transition flex items-center space-x-1.5"
                  >
                    <span>Configure Alert Channels</span>
                  </button>
                  <button
                    onClick={() => setIsArchitectureOpen(true)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold shadow-lg shadow-sky-500/20 transition"
                  >
                    Architecture & ADRs
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <MetricsOverview metrics={metrics} />

            {/* Simulation Studio */}
            <WebhookSimulator onDispatched={loadData} />

            {/* Live Ledger */}
            <LiveEventStream
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelectedEvent}
              onOpenReplay={setReplayEvent}
              onClearAll={handleClearAll}
            />

            {/* Destinations */}
            <DestinationManager
              destinations={destinations}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* Endpoints & Circuits Tab */}
        {activeTab === "endpoints" && (
          <div className="animate-in fade-in duration-150">
            <DestinationManager
              destinations={destinations}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* Event Ledger & DLQ Tab */}
        {activeTab === "events" && (
          <div className="animate-in fade-in duration-150 space-y-4">
            <LiveEventStream
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelectedEvent}
              onOpenReplay={setReplayEvent}
              onClearAll={handleClearAll}
            />
          </div>
        )}

        {/* Discord & Slack Incident Alert Channels Tab */}
        {activeTab === "alerts" && (
          <div className="animate-in fade-in duration-150">
            <AlertChannelsView />
          </div>
        )}

        {/* HMAC Cryptographic Signature Studio */}
        {activeTab === "signer" && (
          <div className="animate-in fade-in duration-150">
            <HmacStudio />
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "keys" && (
          <div className="animate-in fade-in duration-150">
            <ApiKeysView />
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === "audit" && (
          <div className="animate-in fade-in duration-150">
            <AuditLogsView />
          </div>
        )}
      </main>

      {/* Slide-out Event Inspector Drawer */}
      <EventDetailsDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onOpenReplay={(ev) => {
          setSelectedEvent(null);
          setReplayEvent(ev);
        }}
      />

      {/* Dead-Letter Queue (DLQ) Replay Modal */}
      <ReplayModal
        event={replayEvent}
        onClose={() => setReplayEvent(null)}
        onReplayed={() => {
          loadData();
          showToast("Event re-queued for delivery!", "success");
        }}
      />

      {/* System Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#06080d] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">HookFlow</span>
            <span>—</span>
            <span>Architected & Built by <strong className="text-slate-300">Vishnu Vardhan</strong></span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/vishnuvardhan31758-ux/hookflow"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-400 transition"
            >
              GitHub Repository
            </a>
            <a href="/api/openapi" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition">
              OpenAPI Contract
            </a>
            <a href="/api/healthz" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition">
              Health Checks
            </a>
            <span className="text-emerald-400 font-mono">Neon DB Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
