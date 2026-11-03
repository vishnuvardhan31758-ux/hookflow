"use client";

import React, { useState, useEffect } from "react";
import { AuditLog } from "@/lib/audit-logs";
import { ShieldCheck, UserCheck, RefreshCw, Filter } from "lucide-react";

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  const getActionBadge = (action: AuditLog["action"]) => {
    if (action.includes("LOGIN") || action.includes("REGISTER")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800">
          {action}
        </span>
      );
    }
    if (action.includes("KEY")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800">
          {action}
        </span>
      );
    }
    if (action.includes("REPLAY") || action.includes("ENDPOINT")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Security & Activity Audit Trail</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Immutable log of administrative operations, authentication events, and delivery interventions (GDPR Art. 30).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-gray-950 border border-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-gray-900/80 border border-gray-800 shadow-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-950 text-gray-400 font-semibold border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-200">{log.actorEmail}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300 max-w-xs truncate">{log.details}</td>
                    <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">{log.ipAddress}</td>
                    <td className="py-3 px-4 text-right text-gray-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
