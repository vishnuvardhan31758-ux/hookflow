import crypto from "crypto";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "ADMIN" | "ENGINEER" | "AUDITOR";
  organization: string;
  avatarUrl?: string;
  createdAt: number;
}

interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

class AuthService {
  private users: Map<string, StoredUser> = new Map();
  private sessions: Map<string, { userId: string; expiresAt: number }> = new Map();

  constructor() {
    this.seedDefaultUsers();
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  }

  private seedDefaultUsers() {
    // 1. Vishnu Vardhan (Primary Admin)
    const vishnuSalt = crypto.randomBytes(16).toString("hex");
    const vishnuUser: StoredUser = {
      id: "usr_admin_vishnu",
      name: "Vishnu Vardhan",
      username: "vishnu",
      email: "vishnu@hookflow.io",
      role: "ADMIN",
      organization: "TU Munich & HookFlow Systems",
      salt: vishnuSalt,
      passwordHash: this.hashPassword("Vishnu@2026!", vishnuSalt),
      createdAt: Date.now() - 86400000,
    };
    this.users.set(vishnuUser.email.toLowerCase(), vishnuUser);
    this.users.set(vishnuUser.username.toLowerCase(), vishnuUser);

    // 2. Standard System Admin
    const adminSalt = crypto.randomBytes(16).toString("hex");
    const adminUser: StoredUser = {
      id: "usr_admin_01",
      name: "Lead System Admin",
      username: "admin",
      email: "admin@hookflow.io",
      role: "ADMIN",
      organization: "HookFlow Systems",
      salt: adminSalt,
      passwordHash: this.hashPassword("Admin@2026!", adminSalt),
      createdAt: Date.now() - 86400000,
    };
    this.users.set(adminUser.email.toLowerCase(), adminUser);
    this.users.set(adminUser.username.toLowerCase(), adminUser);

    // 3. German Academic Evaluator Account
    const evaluatorSalt = crypto.randomBytes(16).toString("hex");
    const evaluatorUser: StoredUser = {
      id: "usr_tum_reviewer",
      name: "Prof. Dr. Weber (TUM Admissions)",
      username: "reviewer",
      email: "reviewer@tum.de",
      role: "AUDITOR",
      organization: "Technical University of Munich",
      salt: evaluatorSalt,
      passwordHash: this.hashPassword("GermanMasters2026!", evaluatorSalt),
      createdAt: Date.now() - 43200000,
    };
    this.users.set(evaluatorUser.email.toLowerCase(), evaluatorUser);
    this.users.set(evaluatorUser.username.toLowerCase(), evaluatorUser);
  }

  public register(
    name: string,
    email: string,
    password: string,
    organization = "Engineering Org",
    customUsername?: string
  ): { user: User; token: string; isNewUser?: boolean } {
    const normalizedEmail = email.toLowerCase().trim();
    const rawUsername = (customUsername || email.split("@")[0]).toLowerCase().trim();
    const username = rawUsername.replace(/[^a-z0-9_]/g, "");

    if (this.users.has(normalizedEmail)) {
      throw new Error("An account with this email already exists.");
    }

    if (password.length < 4) {
      throw new Error("Password must be at least 4 characters long.");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = this.hashPassword(password, salt);
    const userId = `usr_${crypto.randomBytes(8).toString("hex")}`;

    const newUser: StoredUser = {
      id: userId,
      name: name.trim(),
      username,
      email: normalizedEmail,
      role: "ENGINEER",
      organization,
      salt,
      passwordHash,
      createdAt: Date.now(),
    };

    this.users.set(normalizedEmail, newUser);
    if (!this.users.has(username)) {
      this.users.set(username, newUser);
    }
    const token = this.createSession(userId);

    const { passwordHash: _, salt: __, ...userPublic } = newUser;
    return { user: userPublic, token, isNewUser: true };
  }

  public login(identifier: string, password: string): { user: User; token: string; isNewUser?: boolean } {
    const normalized = identifier.toLowerCase().trim();
    const stored = this.users.get(normalized);

    // Just-In-Time (JIT) Auto-Provisioning for any new Gmail or custom email address!
    if (!stored) {
      if (normalized.includes("@")) {
        const usernamePart = normalized.split("@")[0];
        const formattedName = usernamePart
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        return this.register(
          formattedName,
          normalized,
          password || "Pass@1234",
          "Independent Engineering Workspace",
          usernamePart
        );
      }
      throw new Error("Invalid username/email or password.");
    }

    const computedHash = this.hashPassword(password, stored.salt);
    if (!crypto.timingSafeEqual(Buffer.from(stored.passwordHash, "hex"), Buffer.from(computedHash, "hex"))) {
      throw new Error("Invalid username/email or password.");
    }

    const token = this.createSession(stored.id);
    const { passwordHash: _, salt: __, ...userPublic } = stored;
    return { user: userPublic, token };
  }

  private createSession(userId: string): string {
    const token = `sess_${crypto.randomBytes(32).toString("hex")}`;
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    this.sessions.set(token, { userId, expiresAt });
    return token;
  }

  public validateSession(token: string): User | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      if (session) this.sessions.delete(token);
      return null;
    }

    for (const stored of this.users.values()) {
      if (stored.id === session.userId) {
        const { passwordHash: _, salt: __, ...userPublic } = stored;
        return userPublic;
      }
    }
    return null;
  }

  public logout(token: string): void {
    this.sessions.delete(token);
  }
}

export const globalAuthService = new AuthService();
