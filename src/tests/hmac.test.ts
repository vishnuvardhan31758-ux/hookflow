import { describe, it, expect } from "vitest";
import { generateHmacSignature, verifyHmacSignature, generateSecureSecret } from "../lib/hmac";

describe("HMAC Cryptographic Verification", () => {
  const secret = "sec_test_mock_secret_key_123456789";
  const payload = { event: "payment.created", amount: 5000, currency: "EUR" };

  it("should generate a consistent SHA-256 signature for identical payload", () => {
    const sig1 = generateHmacSignature(payload, secret);
    const sig2 = generateHmacSignature(payload, secret);
    expect(sig1).toBe(sig2);
    expect(sig1.length).toBe(64); // 256 bits = 64 hex characters
  });

  it("should verify valid signature with timing-safe comparison", () => {
    const signature = generateHmacSignature(payload, secret);
    const isValid = verifyHmacSignature(payload, signature, secret);
    expect(isValid).toBe(true);
  });

  it("should reject tampered payload", () => {
    const signature = generateHmacSignature(payload, secret);
    const tamperedPayload = { ...payload, amount: 999999 };
    const isValid = verifyHmacSignature(tamperedPayload, signature, secret);
    expect(isValid).toBe(false);
  });

  it("should reject invalid signature string", () => {
    const isValid = verifyHmacSignature(payload, "invalid_corrupted_signature_hex", secret);
    expect(isValid).toBe(false);
  });

  it("should generate cryptographically random secure secret with prefix", () => {
    const generated = generateSecureSecret("whsec_");
    expect(generated.startsWith("whsec_")).toBe(true);
    expect(generated.length).toBeGreaterThan(20);
  });
});
