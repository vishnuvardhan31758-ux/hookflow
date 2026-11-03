import { NextResponse } from "next/server";
import { globalStore } from "@/lib/store";
import { globalRateLimiter } from "@/lib/rate-limiter";
import { globalCircuitRegistry } from "@/lib/circuit-breaker";

export const dynamic = "force-dynamic";

export async function GET() {
  const uptimeSeconds = Math.floor(process.uptime());
  const memoryUsage = process.memoryUsage();
  const metrics = globalStore.getMetrics();

  return NextResponse.json(
    {
      status: "HEALTHY",
      service: "HookFlow Ingestion & Dispatch Engine",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      system: {
        memoryMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "production",
      },
      subsystems: {
        rateLimiter: "OPERATIONAL",
        circuitBreakers: globalCircuitRegistry.getAll(),
        eventStore: "OPERATIONAL",
      },
      metrics,
    },
    { status: 200 }
  );
}
