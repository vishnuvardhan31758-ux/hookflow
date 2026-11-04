"use client";

import React, { useState } from "react";
import { Play, Flame, AlertOctagon, GitCommit, ShoppingBag, CreditCard, Loader2, IndianRupee, MessageSquare } from "lucide-react";

interface WebhookSimulatorProps {
  onDispatched: () => void;
}

export const WebhookSimulator: React.FC<WebhookSimulatorProps> = ({ onDispatched }) => {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const triggerSimulation = async (scenario: string) => {
    setLoadingScenario(scenario);
    setNotification(null);

    try {
      const res = await fetch("/api/v1/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });

      const data = await res.json();
      if (scenario === "rate_limit_burst") {
        setNotification(
          `⚡ Burst Fired: ${data.accepted} accepted (202), ${data.rateLimited} throttled (429) by Token Bucket!`
        );
      } else {
        setNotification(`✓ Dispatched ${data.source} [HTTP ${data.httpStatus}]`);
      }
      onDispatched();
    } catch (err: unknown) {
      setNotification(`✕ Simulation error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-gray-900/90 to-gray-900/60 border border-gray-800 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Play className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm text-white">Event Simulation Studio</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            1-Click realistic webhook dispatchers to test HMAC verification, exponential backoff, DLQ, and rate limits.
          </p>
        </div>

        {notification && (
          <span className="text-xs px-3 py-1.5 rounded-lg bg-sky-950/80 text-sky-300 border border-sky-800/60 font-mono animate-fade-in">
            {notification}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-4">
        {/* Scenario 1: Stripe */}
        <button
          onClick={() => triggerSimulation("stripe")}
          disabled={loadingScenario !== null}
          className="flex flex-col items-start p-3 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-sky-500/50 transition group disabled:opacity-50 text-left"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 group-hover:text-indigo-300">
              <CreditCard className="w-4 h-4" />
            </span>
            {loadingScenario === "stripe" && <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
          </div>
          <span className="mt-2 text-xs font-semibold text-gray-200">Stripe Payment</span>
          <span className="text-[10px] text-gray-400 mt-0.5 font-mono">payment_intent.succeeded</span>
        </button>

        {/* Scenario 2: GitHub Push */}
        <button
          onClick={() => triggerSimulation("github")}
          disabled={loadingScenario !== null}
          className="flex flex-col items-start p-3 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-sky-500/50 transition group disabled:opacity-50 text-left"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-1.5 rounded-lg bg-gray-950 text-gray-300 group-hover:text-white">
              <GitCommit className="w-4 h-4" />
            </span>
            {loadingScenario === "github" && <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
          </div>
          <span className="mt-2 text-xs font-semibold text-gray-200">GitHub Commit</span>
          <span className="text-[10px] text-gray-400 mt-0.5 font-mono">github.push (main)</span>
        </button>

        {/* Scenario 3: Shopify */}
        <button
          onClick={() => triggerSimulation("shopify")}
          disabled={loadingScenario !== null}
          className="flex flex-col items-start p-3 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-emerald-500/50 transition group disabled:opacity-50 text-left"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 group-hover:text-emerald-300">
              <ShoppingBag className="w-4 h-4" />
            </span>
            {loadingScenario === "shopify" && <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
          </div>
          <span className="mt-2 text-xs font-semibold text-gray-200">Shopify Order</span>
          <span className="text-[10px] text-gray-400 mt-0.5 font-mono">orders.create (EUR)</span>
        </button>

        {/* Scenario 4: Razorpay */}
        <button
          onClick={() => triggerSimulation("razorpay")}
          disabled={loadingScenario !== null}
          className="flex flex-col items-start p-3 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-blue-500/50 transition group disabled:opacity-50 text-left"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-1.5 rounded-lg bg-blue-950 text-blue-400 group-hover:text-blue-300">
              <IndianRupee className="w-4 h-4" />
            </span>
            {loadingScenario === "razorpay" && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
          </div>
          <span className="mt-2 text-xs font-semibold text-gray-200">Razorpay UPI</span>
          <span className="text-[10px] text-gray-400 mt-0.5 font-mono">payment.authorized</span>
        </button>

        {/* Scenario 5: Twilio SMS */}
        <button
          onClick={() => triggerSimulation("twilio")}
          disabled={loadingScenario !== null}
          className="flex flex-col items-start p-3 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-rose-500/50 transition group disabled:opacity-50 text-left"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 group-hover:text-rose-300">
              <MessageSquare className="w-4 h-4" />
            </span>
            {loadingScenario === "twilio" && <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />}
          </div>
          <span className="mt-2 text-xs font-semibold text-gray-200">Twilio SMS</span>
          <span className="text-[10px] text-gray-400 mt-0.5 font-mono">sms.delivered</span>
        </button>

        {/* Scenario 6: 500 Outage (Backoff & DLQ) */}
        <button
          onClick={() => triggerSimulation("failing_500")}
          disabled={loadingScenario !== null}
          className="flex flex-col items-start p-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 hover:border-rose-500/50 transition group disabled:opacity-50 text-left"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-1.5 rounded-lg bg-rose-950 text-rose-400 group-hover:text-rose-300">
              <AlertOctagon className="w-4 h-4" />
            </span>
            {loadingScenario === "failing_500" && <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />}
          </div>
          <span className="mt-2 text-xs font-semibold text-rose-200">Simulate 500 Outage</span>
          <span className="text-[10px] text-rose-400 mt-0.5 font-mono">Test Backoff & DLQ</span>
        </button>

        {/* Scenario 7: DDoS / Rate Limit Burst */}
        <button
          onClick={() => triggerSimulation("rate_limit_burst")}
          disabled={loadingScenario !== null}
          className="flex flex-col items-start p-3 rounded-xl bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/40 hover:border-amber-500/50 transition group disabled:opacity-50 text-left"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-1.5 rounded-lg bg-amber-950 text-amber-400 group-hover:text-amber-300">
              <Flame className="w-4 h-4" />
            </span>
            {loadingScenario === "rate_limit_burst" && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
          </div>
          <span className="mt-2 text-xs font-semibold text-amber-200">12x Traffic Burst</span>
          <span className="text-[10px] text-amber-400 mt-0.5 font-mono">Test Token Bucket 429</span>
        </button>
      </div>
    </div>
  );
};
