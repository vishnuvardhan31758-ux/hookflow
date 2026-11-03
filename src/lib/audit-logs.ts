import crypto from "crypto";

export interface AuditLog {
  id: string;
  action:
    | "USER_LOGIN"
    | "USER_REGISTER"
    | "USER_LOGOUT"
    | "API_KEY_CREATED"
    | "API_KEY_REVOKED"
    | "ENDPOINT_CREATED"
    | "ENDPOINT_DELETED"
    | "CIRCUIT_RESET"
    | "EVENT_REPLAYED"
    | "LEDGER_PURGED";
  actorEmail: string;
  actorRole: string;
  ipAddress: string;
  timestamp: number;
  details: string;
}

class AuditLogService {
  private logs: AuditLog[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    this.record({
      action: "USER_LOGIN",
      actorEmail: "admin@hookflow.io",
      actorRole: "ADMIN",
      ipAddress: "127.0.0.1",
      details: "Initial system bootstrap authentication",
    });
    this.record({
      action: "ENDPOINT_CREATED",
      actorEmail: "admin@hookflow.io",
      actorRole: "ADMIN",
      ipAddress: "127.0.0.1",
      details: "Created Billing Consumer Endpoint with HMAC secret",
    });
  }

  public record(data: Omit<AuditLog, "id" | "timestamp">): AuditLog {
    const log: AuditLog = {
      ...data,
      id: `aud_${crypto.randomBytes(6).toString("hex")}`,
      timestamp: Date.now(),
    };
    this.logs.unshift(log); // Prepend so newest is first
    if (this.logs.length > 200) {
      this.logs.pop(); // Cap memory size
    }
    return log;
  }

  public getLogs(limit = 50): AuditLog[] {
    return this.logs.slice(0, limit);
  }
}

export const globalAuditLogService = new AuditLogService();
