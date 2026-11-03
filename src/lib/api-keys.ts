import crypto from "crypto";

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  secretMasked: string;
  fullSecret?: string; // only returned once upon generation
  environment: "production" | "sandbox";
  scopes: string[];
  createdAt: number;
  lastUsedAt?: number;
  status: "ACTIVE" | "REVOKED";
}

interface StoredApiKey extends ApiKey {
  hashedSecret: string;
}

class ApiKeyService {
  private keys: Map<string, StoredApiKey> = new Map();

  constructor() {
    this.seedDefaults();
  }

  private hashSecret(secret: string): string {
    return crypto.createHash("sha256").update(secret).digest("hex");
  }

  private seedDefaults() {
    // Default production key
    const rawSecret = "hk_live_9a8f27b3e10c4d92a184";
    const hashed = this.hashSecret(rawSecret);
    const key: StoredApiKey = {
      id: "key_prod_default",
      name: "Core Ingestion API Key",
      keyPrefix: "hk_live_9a8f",
      secretMasked: "hk_live_9a8f••••••••••••a184",
      hashedSecret: hashed,
      environment: "production",
      scopes: ["events:write", "events:read", "endpoints:manage"],
      createdAt: Date.now() - 86400000,
      lastUsedAt: Date.now() - 3600000,
      status: "ACTIVE",
    };
    this.keys.set(key.id, key);
  }

  public getKeys(): ApiKey[] {
    return Array.from(this.keys.values()).map(({ hashedSecret: _, ...rest }) => rest);
  }

  public generateKey(data: {
    name: string;
    environment: "production" | "sandbox";
    scopes: string[];
  }): ApiKey {
    const prefix = data.environment === "production" ? "hk_live_" : "hk_test_";
    const randomHex = crypto.randomBytes(16).toString("hex");
    const fullSecret = `${prefix}${randomHex}`;
    const id = `key_${crypto.randomBytes(6).toString("hex")}`;
    const keyPrefix = fullSecret.slice(0, 12);
    const secretMasked = `${keyPrefix}••••••••${fullSecret.slice(-4)}`;
    const hashedSecret = this.hashSecret(fullSecret);

    const newKey: StoredApiKey = {
      id,
      name: data.name.trim(),
      keyPrefix,
      secretMasked,
      fullSecret, // Returned once so user can copy it
      hashedSecret,
      environment: data.environment,
      scopes: data.scopes,
      createdAt: Date.now(),
      status: "ACTIVE",
    };

    this.keys.set(id, newKey);
    return newKey;
  }

  public revokeKey(id: string): boolean {
    const key = this.keys.get(id);
    if (!key) return false;
    key.status = "REVOKED";
    return true;
  }

  public deleteKey(id: string): boolean {
    return this.keys.delete(id);
  }
}

export const globalApiKeyService = new ApiKeyService();
