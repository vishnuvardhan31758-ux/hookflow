"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Activity, Lock, User as UserIcon, ArrowRight, ShieldCheck, UserCheck, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";

  const { login } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(identifier, password);
      if (identifier.includes("@") && !["admin@hookflow.io", "reviewer@tum.de"].includes(identifier.toLowerCase())) {
        showToast(`Workspace initialized for ${identifier}! Welcome to HookFlow.`, "success");
      } else {
        showToast("Signed in successfully! Welcome to HookFlow.", "success");
      }
      router.push(nextUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (demoUser: string, demoPass: string) => {
    setIdentifier(demoUser);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center space-x-2.5 mb-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30 group-hover:scale-105 transition">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent">
            HookFlow
          </span>
        </Link>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Sign in to your Engineering Cockpit
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Enterprise Distributed Webhook & Event Ingestion Platform
        </p>
      </div>

      {/* Form Container */}
      <div className="rounded-2xl bg-gray-900/90 border border-gray-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Username, Gmail, or Work Email
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="your.name@gmail.com or admin"
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              ✨ Any new Gmail address automatically initializes a personal workspace!
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Password
              </label>
              <span className="text-[11px] text-sky-400 hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-950 border border-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In or Auto-Provision</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-gray-800/80">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2.5 text-center">
            Or Use 1-Click Evaluator Credentials
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("admin", "Admin@2026!")}
              className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 text-left transition"
            >
              <div className="flex items-center space-x-1 text-sky-400 text-[11px] font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin</span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                admin
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials("vishnu", "Vishnu@2026!")}
              className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 text-left transition"
            >
              <div className="flex items-center space-x-1 text-indigo-400 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>Vishnu</span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                vishnu
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials("reviewer", "GermanMasters2026!")}
              className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/60 text-left transition"
            >
              <div className="flex items-center space-x-1 text-emerald-400 text-[11px] font-semibold">
                <UserCheck className="w-3 h-3" />
                <span>Reviewer</span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                reviewer
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Register CTA */}
      <div className="mt-5 text-center text-xs text-gray-400">
        <span>Prefer manual registration? </span>
        <Link href="/register" className="text-sky-400 hover:text-sky-300 font-semibold underline">
          Create custom workspace
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-cyber-dark bg-cyber-grid">
      <Suspense fallback={<div className="text-xs text-gray-400">Loading authentication...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
