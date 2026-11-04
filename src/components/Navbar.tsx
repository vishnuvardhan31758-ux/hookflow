"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Activity,
  Layers,
  RefreshCw,
  LogOut,
  LogIn,
  Key,
  ShieldCheck,
  Server,
  Terminal,
  Bell,
  Code2,
  ChevronDown,
  Github,
} from "lucide-react";

export type NavTab = "cockpit" | "endpoints" | "events" | "alerts" | "signer" | "keys" | "audit";

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenArchitecture: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenArchitecture,
  onRefresh,
  isRefreshing,
}) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    showToast("Signed out successfully.", "info");
  };

  const navItems = [
    { id: "cockpit" as NavTab, label: "Cockpit", icon: Activity },
    { id: "endpoints" as NavTab, label: "Endpoints", icon: Server },
    { id: "events" as NavTab, label: "Event Ledger", icon: Terminal },
    { id: "alerts" as NavTab, label: "Alerts (Discord/Slack)", icon: Bell },
    { id: "signer" as NavTab, label: "HMAC Studio", icon: Code2 },
    { id: "keys" as NavTab, label: "API Keys", icon: Key },
    { id: "audit" as NavTab, label: "Audit Trail", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#080b12]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Brand & Creator Badge */}
          <div className="flex items-center space-x-6">
            <div
              onClick={() => onSelectTab("cockpit")}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30 group-hover:scale-105 transition">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-sky-200 to-indigo-300 bg-clip-text text-transparent">
                    HookFlow
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full bg-sky-950/80 text-sky-400 border border-sky-800/80">
                    Enterprise
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                  <span>Architect:</span>
                  <span className="text-slate-200 font-medium">Vishnu Vardhan</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden xl:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                      isActive
                        ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2.5">
            <a
              href="https://github.com/vishnuvardhan31758-ux/hookflow"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="GitHub Repository"
            >
              <Github className="w-3.5 h-3.5 text-slate-400" />
              <span>GitHub</span>
            </a>

            <button
              onClick={onOpenArchitecture}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition"
              title="Architecture & ADRs"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Architecture</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-xs rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition disabled:opacity-50"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>

            {/* User Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-200 hidden md:block max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                    <div className="pb-3 border-b border-slate-800">
                      <div className="font-semibold text-xs text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {user.email}
                      </div>
                      <div className="mt-1 flex items-center space-x-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                          {user.role}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {user.organization}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Pills */}
        <div className="flex xl:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-800/80">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg shrink-0 ${
                activeTab === item.id
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
