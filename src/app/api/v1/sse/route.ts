import { globalSSEBroker } from "@/lib/sse-broker";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`event: connected\ndata: {"status":"connected","timestamp":${Date.now()}}\n\n`));

      const unsubscribe = globalSSEBroker.subscribe((message: string) => {
        try {
          controller.enqueue(encoder.encode(message));
        } catch {
          unsubscribe();
        }
      });

      // Keepalive interval every 25 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(interval);
          unsubscribe();
        }
      }, 25000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
