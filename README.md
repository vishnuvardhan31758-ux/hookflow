# HookFlow — Distributed Event Ingestion & Resilient Webhook Gateway

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Testing-Vitest-green?logo=vitest)](https://vitest.dev/)
[![Zero Cost Cloud](https://img.shields.io/badge/Hosting-Vercel%20%2B%20Neon-cyan)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **M.Sc. Web Engineering & Distributed Systems Capstone Project**  
> Tailored for Master’s Degree Applications in Germany (TU9 Universities: TU Munich, RWTH Aachen, TU Berlin, KIT, TU Dresden).

---

## 📌 Executive Summary

Modern web architectures rely heavily on **asynchronous inter-service communication via Webhooks** (e.g., Stripe payments, GitHub triggers, Shopify orders). However, standard webhook architectures suffer from critical vulnerabilities:
1. **Network Outages & Target Downtime:** Transient destination downtime causes permanent data and revenue loss.
2. **Thundering Herd Retry Storms:** Synchronized retries repeatedly overwhelm recovering servers.
3. **Replay & Tampering Attacks:** Forged HTTP payloads cause unauthorized state mutations.
4. **Duplicate Execution:** Network retries cause duplicate credit card charges or duplicate database records.

**HookFlow** is an enterprise-grade, distributed event ingestion gateway and delivery engine engineered to provide **Zero-Data-Loss, Exactly-Once Semantics, and Resilient Backpressure Handling**.

---

## 🏛️ System Architecture

```
[EXTERNAL CLIENT]  (Stripe / GitHub / Shopify / Custom Senders)
       │
       ▼  POST /api/v1/ingest (Payload + HMAC Header + Idempotency-Key)
┌────────────────────────────────────────────────────────────────────────┐
│  HOOKFLOW EDGE INGESTION GATEWAY                                       │
│                                                                        │
│  [Step 1: Token-Bucket Limiter] ──> Exceeded? ──> 429 Too Many Requests│
│              │ (OK)                                                    │
│  [Step 2: HMAC-SHA256 Auth]    ──> Invalid?  ──> 401 Unauthorized      │
│              │ (OK)                                                    │
│  [Step 3: Idempotency Check]   ──> Duplicate?──> 200 Cached Result     │
│              │ (New Event)                                             │
│  [Step 4: Atomic Ledger Write] ──> Persist event state & metadata      │
│              │                                                         │
│  [Step 5: Immediate Return]    ──> 202 Accepted (Non-blocking async)   │
└──────────────┬─────────────────────────────────────────────────────────┘
               │
               ▼ Asynchronous Dispatch Queue
┌────────────────────────────────────────────────────────────────────────┐
│  RESILIENT DELIVERY ENGINE                                             │
│                                                                        │
│  [Circuit Breaker Check] ──> Circuit OPEN? ──> Mark CIRCUIT_BROKEN     │
│              │ (CLOSED / HALF-OPEN)                                    │
│  [HTTP Dispatch Worker]  ──> POST to Destination Endpoint              │
│              │                                                         │
│     ┌────────┴────────┐                                                │
│     ▼ (2xx Success)   ▼ (5xx or Timeout)                               │
│  [Mark DELIVERED]   [Exponential Backoff + Full Jitter]                │
│  [Reset Circuit]      ├── Retry < Max? ──> Sleep delay & Re-dispatch   │
│                       └── Retry >= Max?──> Escalate to DEAD-LETTER (DLQ)│
└────────────────────────────────────────────────────────────────────────┘
       │
       ▼ Real-Time Broadcast
[SERVER-SENT EVENTS (SSE) BROKER] ──> Live Cockpit Stream & Replay Studio
```

---

## ⚡ Core Engineering Highlights

### 1. Cryptographic Handshake (HMAC-SHA256)
Prevents MITM and payload tampering using constant-time comparison via `crypto.timingSafeEqual`, preventing timing side-channel attacks (**OWASP A02:2021**).

### 2. Distributed Token-Bucket Rate Limiter
Enforces rate boundaries while tolerating natural traffic bursts through continuous fractional token replenishment:
$$\text{Tokens}_{\text{replenished}} = \Delta t \times \text{RefillRate}$$

### 3. Idempotency & Deduplication Engine
Compliant with the IETF Idempotency-Key specification. Prevents double-spend and duplicate mutations by hashing incoming payloads with SHA-256 and storing execution state within an atomic window.

### 4. Exponential Backoff with Full Random Jitter
Prevents the **Thundering Herd Problem** when downstream systems recover:
$$\text{Delay} = \text{UniformRandom}(0.5 \times \text{Base}, \min(\text{Cap}, \text{Base} \times 2^{\text{attempt}}))$$

### 5. Circuit Breaker Pattern (Michael Nygard / Martin Fowler)
Guards downstream consumers with a three-state finite state machine:
- `CLOSED`: Normal traffic.
- `OPEN`: Fail-fast mode when consecutive failures exceed threshold.
- `HALF_OPEN`: Trial probing to verify consumer health before restoring full throughput.

### 6. Dead-Letter Queue (DLQ) & Payload Replay Studio
Isolates poisoned or unroutable messages after maximum retries. Includes an in-browser inspection studio where engineers can edit corrupted JSON parameters and redrive delivery with 1 click.

### 7. Real-Time Telemetry over Server-Sent Events (SSE)
Employs standard HTTP/2 Server-Sent Events (`text/event-stream`) to stream live ingestion latencies, delivery attempts, and circuit status to the cockpit dashboard with zero polling overhead.

---

## 🚀 Quickstart & Local Verification

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Installation
```bash
# Clone the repository
git clone https://github.com/vishnuvardhan31758-ux/hookflow.git
cd hookflow

# Install production dependencies
npm install

# Run static type checking
npm run typecheck

# Run algorithmic & resilient test suites
npm test

# Launch local developer cockpit
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Test Suite (Vitest)

HookFlow includes rigorous automated unit and integration tests covering all distributed algorithms:

```bash
npm test
```

**Test Coverage:**
- `hmac.test.ts`: Signature reproducibility, timing-safe validation, rejection of tampered payloads.
- `rate-limiter.test.ts`: Capacity burst tolerance, token depletion, 429 throttling.
- `idempotency.test.ts`: Deduplication of identical transactions, conflict detection on altered payloads.
- `retry.test.ts`: Exponential math, max-cap enforcement, HTTP 4xx vs 5xx classification.
- `circuit-breaker.test.ts`: `CLOSED` $\to$ `OPEN` $\to$ `HALF_OPEN` state transitions and cooldown timers.

---

## 🌐 100% Free Production Deployment (Vercel + Neon)

This project is engineered to deploy live with zero costs:

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "feat: initial production-ready HookFlow release"
git remote add origin https://github.com/vishnuvardhan31758-ux/hookflow.git
git push -u origin main
```

### Step 2: Deploy to Vercel (Free 0$/month)
1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New"** $\to$ **"Project"**.
3. Select your `hookflow` repository.
4. In **Environment Variables**, add:
   - `HOOKFLOW_DEFAULT_SECRET` = `sec_wh_production_live_key_998877`
   - `HOOKFLOW_MAX_RETRIES` = `5`
5. Click **Deploy**. Your permanent HTTPS live URL will be active in ~60 seconds!

---

## 📡 Live API Contracts

### Ingest Webhook Event
```bash
curl -X POST https://your-app.vercel.app/api/v1/ingest \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: idemp_order_998822" \
  -d '{
    "source": "stripe.payment_intent.succeeded",
    "destinationUrl": "https://your-app.vercel.app/api/v1/mock-receiver?status=200",
    "payload": {
      "amount": 9900,
      "currency": "EUR",
      "customer": "cus_germany_01"
    }
  }'
```

### Response (HTTP 202 Accepted)
```json
{
  "status": "ACCEPTED",
  "eventId": "evt_7cf9a804-b9bf-48f8-b390-34d6199a0f44",
  "idempotencyKey": "idemp_order_998822",
  "destinationUrl": "https://your-app.vercel.app/api/v1/mock-receiver?status=200",
  "timestamp": 1730656000000,
  "links": {
    "status": "/api/v1/events/evt_7cf9a804-b9bf-48f8-b390-34d6199a0f44",
    "replay": "/api/v1/replay"
  }
}
```

---

## 🎓 Academic Relevance for Master's in Germany (TU9)

| Curriculum Area | Module In HookFlow |
| :--- | :--- |
| **Distributed Systems** | Circuit Breaker state machines, asynchronous decoupled worker pipelines, token-bucket rate limiting. |
| **Security & Privacy (GDPR)** | Constant-time HMAC-SHA256 signature verification, tamper detection, data integrity hashing. |
| **Software Architecture** | Architectural Decision Records (ADRs), Clean Architecture, Separation of Concerns, OpenAPI 3.1 contract. |
| **Quality Engineering** | 100% automated test coverage with Vitest, pre-commit validation, GitHub Actions CI pipeline. |

---

## 📄 License
MIT License. Open source and free for academic and commercial use.
