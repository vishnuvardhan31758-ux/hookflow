"use client";

import React, { useState } from "react";
import { WebhookEvent, EventStatus } from "@/lib/types";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Zap,
  ArrowRight,
  Filter,
  Trash2,
  Download,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";

interface LiveEventStreamProps {
  events: WebhookEvent[];
  selectedEvent: WebhookEvent | null;
  onSelectEvent: (event: WebhookEvent) => void;
  onOpenReplay: (event: WebhookEvent) => void;
  onClearAll: () => void;
}

export const LiveEventStream: React.FC<LiveEventStreamProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onOpenReplay,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<"ALL" | EventStatus>("ALL");
  const [search, setSearch] = useState("");

  const exportCSV = () => {
    if (filteredEvents.length === 0) return;
    const headers = ["ID", "Source", "DestinationUrl", "Status", "Attempts", "MaxRetries", "CreatedAt", "LastStatusCode", "LastLatencyMs"];
    const rows = filteredEvents.map((ev) => {
      const last = ev.attempts[ev.attempts.length - 1];
      return [
        `"${ev.id}"`,
        `"${ev.source}"`,
        `"${ev.destinationUrl}"`,
        `"${ev.status}"`,
        ev.attempts.length,
        ev.maxRetries,
        `"${new Date(ev.createdAt).toISOString()}"`,
        last?.statusCode || "N/A",
        last?.durationMs || 0,
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hookflow-ledger-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (filteredEvents.length === 0) return;
    const blob = new Blob([JSON.stringify(filteredEvents, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hookflow-ledger-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEvents = events.filter((e) => {
    const matchesFilter = filter === "ALL" ? true : e.status === filter;
    const matchesSearch =
      search === "" ||
      e.source.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.destinationUrl.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case "DELIVERED":
      case "REPLAYED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {status}
          </span>
        );
      case "RETRYING":
      case "PROCESSING":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-400 border border-amber-800">
            <Clock className="w-3 h-3 mr-1 animate-spin" />
            {status}
          </span>
        );
      case "FAILED_DLQ":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950 text-rose-400 border border-rose-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            DLQ ISOLATED
          </span>
        );
      case "CIRCUIT_BROKEN":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950 text-purple-400 border border-purple-800">
            <Zap className="w-3 h-3 mr-1" />
            CIRCUIT OPEN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-800 text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-gray-900/80 border border-gray-800 shadow-lg overflow-hidden flex flex-col">
      {/* Header & Controls */}
      <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-900/90">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 radar-live" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Live Ingestion Ledger
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 font-mono">
            {filteredEvents.length} shown
          </span>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Search source, URL or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg bg-gray-950 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-500"
          />

          {/* Filter Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-gray-950 border border-gray-800">
            {(["ALL", "DELIVERED", "RETRYING", "FAILED_DLQ"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                  filter === tab
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab === "FAILED_DLQ" ? "DLQ" : tab}
              </button>
            ))}
          </div>

          {events.length > 0 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={exportCSV}
                className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Export Filtered Events as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
              <button
                onClick={exportJSON}
                className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Export Filtered Events as JSON"
              >
                <FileCode className="w-3.5 h-3.5 text-sky-400" />
                <span>JSON</span>
              </button>
              <button
                onClick={onClearAll}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition border border-transparent hover:border-rose-900/40"
                title="Purge Ledger"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="divide-y divide-gray-800/60 max-h-[560px] overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-40 text-sky-400" />
            <p className="text-sm font-medium text-gray-300">No matching events in ledger</p>
            <p className="text-xs text-gray-500 mt-1">
              Use the Event Simulation Studio above or send an HTTP POST to <code className="text-sky-400">/api/v1/ingest</code>.
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isSelected = selectedEvent?.id === event.id;
            const lastAttempt = event.attempts[event.attempts.length - 1];

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`p-3.5 sm:p-4 hover:bg-gray-800/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected ? "bg-sky-950/20 border-l-2 border-sky-400" : ""
                }`}
              >
                {/* Event Info */}
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="pt-0.5">{getStatusBadge(event.status)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs sm:text-sm text-gray-200 truncate">
                        {event.source}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
                        {event.id.slice(0, 16)}...
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-gray-400 mt-1">
                      <span className="truncate max-w-[220px] sm:max-w-xs font-mono text-gray-400">
                        {event.destinationUrl}
                      </span>
                      {lastAttempt && (
                        <>
                          <span>•</span>
                          <span
                            className={`font-mono font-medium ${
                              lastAttempt.statusCode && lastAttempt.statusCode >= 200 && lastAttempt.statusCode < 300
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            HTTP {lastAttempt.statusCode || "ERR"}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-gray-400">
                            {lastAttempt.durationMs}ms
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side status / Replay CTA */}
                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <div className="text-right text-[11px] text-gray-500 font-mono">
                    <span>
                      Att: {event.attempts.length}/{event.maxRetries}
                    </span>
                    <div className="text-[10px] text-gray-500">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  {(event.status === "FAILED_DLQ" || event.status === "CIRCUIT_BROKEN") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReplay(event);
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition"
                      title="Replay Event"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Replay</span>
                    </button>
                  )}

                  <ArrowRight className="w-4 h-4 text-gray-600 hidden sm:block" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
