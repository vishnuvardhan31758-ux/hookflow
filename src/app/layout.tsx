import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

export const metadata: Metadata = {
  title: "HookFlow | Distributed Event Ingestion & Resilient Webhook Gateway",
  description:
    "Enterprise-grade resilient webhook ingestion engine featuring HMAC-SHA256 verification, token-bucket rate limiting, idempotency locks, circuit breakers, and automated DLQ recovery.",
  authors: [{ name: "HookFlow Engineering" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cyber-dark text-gray-100 min-h-screen bg-cyber-grid antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
