"use client";

import React, { useState, useEffect } from "react";
import { ApiKey } from "@/lib/api-keys";
import { useToast } from "@/context/ToastContext";
import { Key, Plus, Copy, Check, Trash2, Shield, AlertCircle, Terminal } from "lucide-react";

export const ApiKeysView: React.FC = () => {
  const { showToast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<"production" | "sandbox">("production");
  const [scopes, setScopes] = useState<string[]>(["events:write", "events:read"]);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/v1/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, environment, scopes }),
      });

      if (!res.ok) throw new Error("Failed to generate key");
      const data: ApiKey = await res.json();
      setNewlyCreatedKey(data);
      setName("");
      fetchKeys();
      showToast("API key generated successfully!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error", "error");
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchKeys();
        showToast("API key revoked.", "info");
      }
    } catch {
      showToast("Failed to revoke key.", "error");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    showToast("API key copied to clipboard!", "success");
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-bold text-white">API Keys & Access Tokens</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Authenticate programmatic requests to <code className="text-sky-300">/api/v1/ingest</code> using secret bearer tokens.
          </p>
        </div>

        <button
          onClick={() => {
            setNewlyCreatedKey(null);
            setShowGenerateModal(true);
          }}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Keys List */}
      <div className="rounded-2xl bg-gray-900/80 border border-gray-800 shadow-lg overflow-hidden">
        {keys.length === 0 && !isLoading ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No API keys generated yet. Click &quot;Generate New Key&quot; above.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {keys.map((key) => {
              const isRevoked = key.status === "REVOKED";
              return (
                <div
                  key={key.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-800/30 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-semibold text-xs sm:text-sm text-gray-100">
                        {key.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          key.environment === "production"
                            ? "bg-purple-950 text-purple-300 border border-purple-800"
                            : "bg-amber-950 text-amber-300 border border-amber-800"
                        }`}
                      >
                        {key.environment}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isRevoked
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        }`}
                      >
                        {key.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span className="font-mono text-gray-300 bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800">
                        {key.secretMasked}
                      </span>
                      <button
                        onClick={() => copyToClipboard(key.secretMasked, key.id)}
                        className="text-gray-400 hover:text-white transition"
                        title="Copy key"
                      >
                        {copiedKeyId === key.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {key.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-950 text-gray-400 border border-gray-800"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span className="text-[11px] text-gray-500 font-mono">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                    </span>

                    {!isRevoked && (
                      <button
                        onClick={() => handleRevoke(key.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate Key Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in-95">
            {!newlyCreatedKey ? (
              <>
                <h3 className="font-bold text-sm text-white mb-1">Generate API Key</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Configure permission scopes and environment for your integration.
                </p>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Key Name / Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stripe Webhook Relay"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-gray-950 border border-gray-800 text-gray-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Environment
                    </label>
                    <select
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value as "production" | "sandbox")}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-gray-950 border border-gray-800 text-gray-100 focus:outline-none focus:border-sky-500"
                    >
                      <option value="production">Production (hk_live_...)</option>
                      <option value="sandbox">Sandbox / Testing (hk_test_...)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Permission Scopes
                    </label>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { id: "events:write", label: "events:write (Ingest webhooks)" },
                        { id: "events:read", label: "events:read (Query event ledger)" },
                        { id: "endpoints:manage", label: "endpoints:manage (Configure destinations)" },
                        { id: "admin", label: "admin (Full administrative access)" },
                      ].map((item) => (
                        <label key={item.id} className="flex items-center space-x-2 text-gray-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={scopes.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setScopes([...scopes, item.id]);
                              } else {
                                setScopes(scopes.filter((s) => s !== item.id));
                              }
                            }}
                            className="rounded border-gray-700 bg-gray-950 text-sky-500"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => setShowGenerateModal(false)}
                      className="px-3.5 py-1.5 text-xs rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-400 text-gray-950 shadow-md"
                    >
                      Create API Key
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Shield className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-white">Save Your API Key</h3>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    This secret key will <strong>never be displayed again</strong>. Copy it now and store it in your environment variables.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400 font-mono">FULL SECRET KEY</span>
                    <button
                      onClick={() => copyToClipboard(newlyCreatedKey.fullSecret || "", "modal")}
                      className="flex items-center space-x-1 text-xs text-sky-400 hover:text-sky-300"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-emerald-300 break-all select-all">
                    {newlyCreatedKey.fullSecret}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setShowGenerateModal(false);
                      setNewlyCreatedKey(null);
                    }}
                    className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-400 text-gray-950"
                  >
                    I Have Saved It
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
