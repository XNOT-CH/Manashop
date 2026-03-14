import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
    query: {
      apiKeys: {
        findFirst: vi.fn(),
      },
    },
  },
  apiKeys: {
    key: "key",
    keyPrefix: "keyPrefix",
    isActive: "isActive",
    id: "id",
  },
}));

vi.mock("@/lib/utils/date", () => ({
  mysqlNow: vi.fn(() => "2026-01-01 00:00:00"),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

import { db } from "@/lib/db";

describe("lib/apiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateApiKey", () => {
    it("generates raw key, hashed key, and prefix", async () => {
      const { generateApiKey } = await import("@/lib/apiKey");
      const result = generateApiKey();
      
      expect(result.rawKey).toHaveLength(64); // 32 bytes hex
      expect(result.hashedKey).toHaveLength(64); // sha256 hex
      expect(result.prefix).toHaveLength(8);
      expect(result.rawKey.startsWith(result.prefix)).toBe(true);
    });

    it("generates unique keys", async () => {
      const { generateApiKey } = await import("@/lib/apiKey");
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1.rawKey).not.toBe(key2.rawKey);
    });
  });

  describe("hashApiKey", () => {
    it("hashes consistently", async () => {
      const { hashApiKey } = await import("@/lib/apiKey");
      const hash1 = hashApiKey("test-key");
      const hash2 = hashApiKey("test-key");
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe("validateApiKey", () => {
    it("returns invalid for wrong length key", async () => {
      const { validateApiKey } = await import("@/lib/apiKey");
      const result = await validateApiKey("short");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid API key format");
    });

    it("returns invalid if key not found", async () => {
      (db.query.apiKeys.findFirst as any).mockResolvedValue(null);
      const { validateApiKey } = await import("@/lib/apiKey");
      const result = await validateApiKey("a".repeat(64));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("returns invalid if key expired", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      (db.query.apiKeys.findFirst as any).mockResolvedValue({
        id: "key-1",
        userId: "u1",
        expiresAt: pastDate.toISOString(),
        permissions: null,
        user: { id: "u1", role: "ADMIN", permissions: null },
      });
      const { validateApiKey } = await import("@/lib/apiKey");
      const result = await validateApiKey("a".repeat(64));
      expect(result.valid).toBe(false);
      expect(result.error).toContain("expired");
    });

    it("returns valid for active non-expired key", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      (db.query.apiKeys.findFirst as any).mockResolvedValue({
        id: "key-1",
        userId: "u1",
        expiresAt: futureDate.toISOString(),
        permissions: JSON.stringify(["product:view"]),
        user: { id: "u1", role: "ADMIN", permissions: null },
      });
      const { validateApiKey } = await import("@/lib/apiKey");
      const result = await validateApiKey("a".repeat(64));
      expect(result.valid).toBe(true);
      expect(result.userId).toBe("u1");
      expect(result.permissions).toContain("product:view");
    });
  });

  describe("createApiKey", () => {
    it("creates key and returns id + raw key", async () => {
      (db.query.apiKeys.findFirst as any).mockResolvedValue({ id: "new-key-id" });
      const { createApiKey } = await import("@/lib/apiKey");
      const result = await createApiKey("u1", "My Key", ["product:view"], 30);
      
      expect(result.id).toBe("new-key-id");
      expect(result.rawKey).toHaveLength(64);
      expect(db.insert).toHaveBeenCalled();
    });

    it("throws if insert fails", async () => {
      (db.query.apiKeys.findFirst as any).mockResolvedValue(null);
      const { createApiKey } = await import("@/lib/apiKey");
      await expect(createApiKey("u1", "Key")).rejects.toThrow("Failed to insert API key");
    });
  });

  describe("revokeApiKey", () => {
    it("sets isActive to false", async () => {
      const { revokeApiKey } = await import("@/lib/apiKey");
      await revokeApiKey("key-1");
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("apiKeyHasPermission", () => {
    it("returns false if API key doesn't have required permission", async () => {
      const { apiKeyHasPermission } = await import("@/lib/apiKey");
      const result = apiKeyHasPermission(
        ["product:view"],
        "ADMIN",
        null,
        "product:create" as any
      );
      expect(result).toBe(false);
    });

    it("checks user role permission when API key has empty permissions", async () => {
      const { apiKeyHasPermission } = await import("@/lib/apiKey");
      // ADMIN has all permissions
      const result = apiKeyHasPermission([], "ADMIN", null, "product:view" as any);
      expect(result).toBe(true);
    });
  });
});
