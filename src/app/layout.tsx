import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HookFlow | Distributed Event Ingestion & Resilient Webhook Gateway",
  description:
    "Enterprise-grade resilient webhook ingestion engine featuring HMAC-SHA256 verification, token-bucket rate limiting, idempotency locks, circuit breakers, and automated DLQ recovery.",
  authors: [{ name: "HookFlow Engineering" }],
  keywords: [
    "Web Engineering",
    "Distributed Systems",
    "Webhooks",
    "Idempotency",
    "Circuit Breaker",
    "Dead Letter Queue",
    "Next.js",
    "TypeScript",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cyber-dark text-gray-100 min-h-screen bg-cyber-grid antialiased">
        {children}
      </body>
    </html>
  );
}
