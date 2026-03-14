import { describe, it, expect, vi, beforeEach } from "vitest";

describe("lib/encryption", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ENCRYPTION_KEY = "gamestore-secret-key-12345678901"; // 32 bytes
  });

  it("encrypts and decrypts correctly (GCM)", async () => {
    const { encrypt, decrypt } = await import("@/lib/encryption");
    const secret = "my top secret data";
    
    const encrypted = encrypt(secret);
    expect(encrypted).not.toBe(secret);
    expect(encrypted.split(":")).toHaveLength(3); // iv:encrypted:tag
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(secret);
  });

  it("returns original text on decryption failure", async () => {
    const { decrypt } = await import("@/lib/encryption");
    const fakeData = "not-encrypted-data";
    expect(decrypt(fakeData)).toBe(fakeData);
    
    // Invalid encrypted format
    expect(decrypt("invalid:hex:parts")).toBe("invalid:hex:parts");
  });

  it("throws in production without ENCRYPTION_KEY", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.ENCRYPTION_KEY;

    const { encrypt } = await import("@/lib/encryption");
    expect(() => encrypt("test")).toThrow(/ENCRYPTION_KEY environment variable is required in production/);
    
    vi.unstubAllEnvs(); // Reset
  });

  it("throws if ENCRYPTION_KEY is wrong length", async () => {
    process.env.ENCRYPTION_KEY = "short";

    const { encrypt } = await import("@/lib/encryption");
    expect(() => encrypt("test")).toThrow(/ENCRYPTION_KEY must be exactly 32 bytes/);
  });

  it("falls back to DEV_FALLBACK_KEY if no key provided in non-production", async () => {
    delete process.env.ENCRYPTION_KEY;
    const { encrypt, decrypt } = await import("@/lib/encryption");
    
    const encrypted = encrypt("test");
    expect(decrypt(encrypted)).toBe("test");
  });

  describe("isEncrypted", () => {
    it("returns false for plain text", async () => {
      const { isEncrypted } = await import("@/lib/encryption");
      expect(isEncrypted("plain text")).toBe(false);
    });

    it("returns false for invalid hex", async () => {
      const { isEncrypted } = await import("@/lib/encryption");
      expect(isEncrypted("invalid:hex")).toBe(false);
    });
    
    it("returns true for valid legacy CBC format", async () => {
      const { isEncrypted } = await import("@/lib/encryption");
      // 32 chars hex IV : hex body
      const fakeEncrypted = `${"a".repeat(32)}:1a2b3c`;
      expect(isEncrypted(fakeEncrypted)).toBe(true);
    });
  });
  
  it("decrypts legacy CBC format correctly", async () => {
    const { encrypt, decrypt } = await import("@/lib/encryption");
    // Generate old CBC format manually for testing
    const crypto = await import("node:crypto");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from("gamestore-secret-key-12345678901"), iv);
    let encrypted = cipher.update(Buffer.from("legacy data"));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const legacyEncryptedString = `${iv.toString("hex")}:${encrypted.toString("hex")}`;
    
    expect(decrypt(legacyEncryptedString)).toBe("legacy data");
  });
});
