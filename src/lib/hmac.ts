import crypto from "crypto";

/**
 * HookFlow Cryptographic Module
 * Generates and validates HMAC-SHA256 signatures with constant-time equality checks
 * preventing timing side-channel attacks (OWASP A02:2021 - Cryptographic Failures).
 */

export function generateHmacSignature(payload: string | object, secret: string): string {
  const content = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(content, "utf8").digest("hex");
}

export function verifyHmacSignature(
  payload: string | object,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    const expected = generateHmacSignature(payload, secret);
    const expectedBuffer = Buffer.from(expected, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    // crypto.timingSafeEqual prevents timing side-channel attacks
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}

export function generateSecureSecret(prefix = "sec_wh_"): string {
  return `${prefix}${crypto.randomBytes(24).toString("hex")}`;
}
