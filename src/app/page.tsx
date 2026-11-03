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
import { useToast } from "@/context/ToastContext";

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
        fetch("/api/v1/events?limit=50"),
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

          // Refresh metrics on updates
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
    showToast("Event ledger purged.", "info");
    loadData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-cyber-dark text-gray-100">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onRefresh={() => {
          loadData();
          showToast("Data refreshed.", "info");
        }}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cockpit / Overview Tab */}
        {activeTab === "cockpit" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-purple-950/20 border border-sky-900/30 shadow-sm">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Enterprise Web Engineering Platform
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Active Session Ready
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                  HookFlow Distributed Event Ingestion & Webhook Gateway
                </h1>
                <p className="text-xs text-gray-400 mt-1 max-w-3xl">
                  Fault-tolerant event ingestion engine built with HMAC-SHA256 constant-time verification, distributed token-bucket rate limiting, exponential backoff with full jitter, circuit breakers, and automated DLQ recovery.
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setIsArchitectureOpen(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-400 text-gray-950 shadow-lg shadow-sky-500/20 transition"
                >
                  View Architecture & ADRs
                </button>
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

        {/* Endpoints Tab */}
        {activeTab === "endpoints" && (
          <div className="animate-in fade-in duration-150">
            <DestinationManager
              destinations={destinations}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* Event Ledger Tab */}
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

      {/* System Architecture & Master's Academic Evaluation Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-800/80 bg-gray-950/80 py-6 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-300">HookFlow</span>
            <span>—</span>
            <span>M.Sc. Web Engineering Capstone Project</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/api/openapi" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition">
              OpenAPI Spec
            </a>
            <a href="/api/healthz" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition">
              Health Checks
            </a>
            <span>Zero-Cost Global Cloud Deployment</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
