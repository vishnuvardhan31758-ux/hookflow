/**
 * Server-Sent Events (SSE) Broadcast Broker
 * Maintains active client connections and broadcasts live event ingestion,
 * delivery updates, and circuit breaker transitions in real time.
 */

type Listener = (data: string) => void;

class SSEBroker {
  private listeners: Set<Listener> = new Set();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(type: string, payload: unknown): void {
    const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch {
        // Listener dropped
        this.listeners.delete(listener);
      }
    }
  }

  public getSubscriberCount(): number {
    return this.listeners.size;
  }
}

export const globalSSEBroker = new SSEBroker();
