"use client";

import React from "react";
import { Activity, ShieldCheck, BookOpen, Layers, RefreshCw, ExternalLink } from "lucide-react";

interface NavbarProps {
  onOpenArchitecture: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  eventCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenArchitecture,
  onRefresh,
  isRefreshing,
  eventCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent">
                  HookFlow
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                  v1.0 Core
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                Distributed Ingestion & Resilient Webhook Gateway
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-gray-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-emerald-400">EDGE OPERATIONAL</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenArchitecture}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
            title="Inspect System Architecture & ADRs"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">System Architecture</span>
          </button>

          <a
            href="/api/openapi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">OpenAPI 3.1</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>

          <a
            href="/api/healthz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Healthz</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-xs font-medium rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 transition disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
