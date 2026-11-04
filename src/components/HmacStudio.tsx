"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { Code, Send, Copy, Check, Terminal, ShieldCheck } from "lucide-react";

export const HmacStudio: React.FC = () => {
  const { showToast } = useToast();
  const [secret, setSecret] = useState("sec_wh_production_live_key_998877");
  const [payload, setPayload] = useState(
    JSON.stringify(
      {
        event: "invoice.payment_succeeded",
        amount_cents: 9900,
        currency: "USD",
        customer_email: "alex@enterprise.com",
      },
      null,
      2
    )
  );
  const [computedSignature, setComputedSignature] = useState("");
  const [isComputing, setIsComputing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const calculateHmac = async (payloadStr: string, secretStr: string) => {
    try {
      setIsComputing(true);
      let parsed = {};
      try {
        parsed = JSON.parse(payloadStr);
      } catch {
        parsed = { raw: payloadStr };
      }

      const res = await fetch("/api/v1/hmac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: parsed, secret: secretStr }),
      });

      if (res.ok) {
        const data = await res.json();
        setComputedSignature(data.signature);
      }
    } catch (err) {
      console.warn("HMAC computation error:", err);
    } finally {
      setIsComputing(false);
    }
  };

  useEffect(() => {
    calculateHmac(payload, secret);
  }, [payload, secret]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleTestDispatch = async () => {
    setIsDispatching(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(payload);
      } catch {
        parsed = { raw: payload };
      }

      const res = await fetch("/api/v1/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-HookFlow-Signature": computedSignature,
          "Idempotency-Key": `play_${Date.now()}`,
        },
        body: JSON.stringify({
          source: "custom.playground.event",
          destinationUrl: "https://httpbin.org/status/200",
          payload: parsed,
        }),
      });

      if (res.status === 202) {
        showToast("Signature validated! Ingested with HTTP 202 Accepted.", "success");
      } else {
        const data = await res.json();
        showToast(`Gateway returned HTTP ${res.status}: ${data.error || "Rejected"}`, "error");
      }
    } catch {
      showToast("Dispatch network error", "error");
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-b from-gray-900/90 to-gray-950 border border-gray-800 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Code className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-white">
              Cryptographic HMAC-SHA256 Signature Studio
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Generate and verify constant-time SHA-256 signatures for external webhook integrations (preventing OWASP A02 timing side-channels).
          </p>
        </div>

        <button
          onClick={handleTestDispatch}
          disabled={isDispatching}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-medium shadow-md transition disabled:opacity-50 self-start sm:self-auto"
        >
          <Send className={`w-3.5 h-3.5 ${isDispatching ? "animate-spin" : ""}`} />
          <span>{isDispatching ? "Validating..." : "Dispatch to Gateway"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Input Payload & Secret */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Webhook Signing Secret
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-gray-950 border border-gray-800 text-gray-200 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
              JSON Payload Body
            </label>
            <textarea
              rows={7}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-gray-950 border border-gray-800 text-emerald-400 font-mono focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>
        </div>

        {/* Right: Signature & cURL snippet */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                Computed Signature (Hex)
              </label>
              <button
                onClick={() => copyToClipboard(computedSignature, "sig")}
                className="flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              >
                {copiedType === "sig" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedType === "sig" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-950 border border-gray-800 font-mono text-xs text-sky-300 break-all select-all">
              {isComputing ? "Computing digest..." : computedSignature}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                Production cURL Command
              </label>
              <button
                onClick={() =>
                  copyToClipboard(
                    `curl -X POST http://localhost:3001/api/v1/ingest \\\n  -H "Content-Type: application/json" \\\n  -H "X-HookFlow-Signature: ${computedSignature}" \\\n  -H "Idempotency-Key: idemp_${Date.now()}" \\\n  -d '${payload.replace(/\n/g, "")}'`,
                    "curl"
                  )
                }
                className="flex items-center space-x-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              >
                {copiedType === "curl" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedType === "curl" ? "Copied" : "Copy cURL"}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-gray-950 border border-gray-800 font-mono text-[11px] text-gray-300 overflow-x-auto max-h-[140px] leading-relaxed">
{`curl -X POST http://localhost:3001/api/v1/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-HookFlow-Signature: ${computedSignature}" \\
  -H "Idempotency-Key: idemp_${Date.now()}" \\
  -d '${payload.replace(/\n/g, "")}'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
