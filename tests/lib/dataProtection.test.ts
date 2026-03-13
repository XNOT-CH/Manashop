import { describe, it, expect, vi } from "vitest";
import {
  assertNoSecretDataLeak,
  stripSecretData,
  sanitizeObject,
  sanitizeArray,
  maskEmail,
  maskPhone,
  maskIpAddress,
  maskCreditCard,
  maskApiKey,
  sanitizeForLog,
  safeLog,
  prepareUserForResponse,
  prepareProductForCustomer,
  prepareProductForAdmin,
} from "@/lib/dataProtection";

describe("dataProtection utilities", () => {
  describe("assertNoSecretDataLeak", () => {
    it("does not throw when no secretData", () => {
      expect(() => assertNoSecretDataLeak({ name: "test" })).not.toThrow();
    });

    it("does not throw when secretData is empty/falsy", () => {
      expect(() => assertNoSecretDataLeak({ secretData: "" })).not.toThrow();
      expect(() => assertNoSecretDataLeak({ secretData: null })).not.toThrow();
    });

    it("throws when secretData is present and truthy", () => {
      expect(() => assertNoSecretDataLeak({ secretData: "secret-code-123" })).toThrow("SECURITY ALERT");
    });

    it("includes context in error message", () => {
      expect(() => assertNoSecretDataLeak({ secretData: "x" }, "ProductAPI")).toThrow("ProductAPI");
    });
  });

  describe("stripSecretData", () => {
    it("removes secretData field", () => {
      const result = stripSecretData({ id: "1", name: "test", secretData: "secret" });
      expect(result).toEqual({ id: "1", name: "test" });
      expect("secretData" in result).toBe(false);
    });

    it("returns same object without secretData", () => {
      const result = stripSecretData({ id: "1", name: "test" });
      expect(result).toEqual({ id: "1", name: "test" });
    });
  });

  describe("sanitizeObject", () => {
    it("removes default sensitive fields", () => {
      const result = sanitizeObject({ name: "test", password: "secret", token: "abc", key: "xyz" });
      expect(result.password).toBeUndefined();
      expect(result.token).toBeUndefined();
      expect(result.key).toBeUndefined();
      expect(result.name).toBe("test");
    });

    it("removes custom fields", () => {
      const result = sanitizeObject({ a: 1, b: 2, c: 3 }, ["b"]);
      expect(result.b).toBeUndefined();
      expect(result.a).toBe(1);
      expect(result.c).toBe(3);
    });
  });

  describe("sanitizeArray", () => {
    it("sanitizes all objects in array", () => {
      const result = sanitizeArray([
        { name: "A", password: "p1" },
        { name: "B", password: "p2" },
      ]);
      expect(result[0].password).toBeUndefined();
      expect(result[1].password).toBeUndefined();
      expect(result[0].name).toBe("A");
    });
  });

  describe("maskEmail", () => {
    it("masks email with 3+ char local part", () => {
      expect(maskEmail("john@example.com")).toBe("joh***@example.com");
    });

    it("masks short local part entirely", () => {
      expect(maskEmail("ab@x.com")).toBe("***@x.com");
    });

    it("handles missing @", () => {
      expect(maskEmail("noemail")).toBe("***@***.***");
    });

    it("handles empty/null", () => {
      expect(maskEmail("")).toBe("***@***.***");
      expect(maskEmail(null as unknown as string)).toBe("***@***.***");
    });
  });

  describe("maskPhone", () => {
    it("masks showing last 4 digits", () => {
      expect(maskPhone("0812345678")).toBe("***-***-5678");
    });

    it("handles short phone", () => {
      expect(maskPhone("123")).toBe("****");
    });

    it("handles empty", () => {
      expect(maskPhone("")).toBe("****");
    });
  });

  describe("maskIpAddress", () => {
    it("masks middle octets", () => {
      const result = maskIpAddress("192.168.1.100");
      expect(result).toContain("192");
      expect(result).toContain("100");
    });

    it("returns original for non-IPv4", () => {
      expect(maskIpAddress("::1")).toBe("::1");
    });

    it("handles empty", () => {
      expect(maskIpAddress("")).toContain("*");
    });
  });

  describe("maskCreditCard", () => {
    it("shows last 4 digits", () => {
      expect(maskCreditCard("4111111111111111")).toBe("**** **** **** 1111");
    });

    it("handles short number", () => {
      expect(maskCreditCard("123")).toBe("****");
    });

    it("handles empty", () => {
      expect(maskCreditCard("")).toBe("****");
    });
  });

  describe("maskApiKey", () => {
    it("shows first 8 chars", () => {
      const result = maskApiKey("sk_live_12345678901234567890");
      expect(result).toBe("sk_live_************************");
    });

    it("handles short key", () => {
      expect(maskApiKey("short")).toBe("********");
    });

    it("handles empty", () => {
      expect(maskApiKey("")).toBe("********");
    });
  });

  describe("sanitizeForLog", () => {
    it("redacts sensitive fields", () => {
      const result = sanitizeForLog({ name: "test", password: "secret", token: "abc" });
      expect(result.password).toBe("[REDACTED]");
      expect(result.token).toBe("[REDACTED]");
      expect(result.name).toBe("test");
    });

    it("masks email field", () => {
      const result = sanitizeForLog({ email: "john@example.com" });
      expect(result.email).toBe("joh***@example.com");
    });

    it("masks ipAddress field", () => {
      const result = sanitizeForLog({ ipAddress: "192.168.1.1" });
      expect(result.ipAddress).toContain("192");
    });

    it("recursively sanitizes nested objects", () => {
      const result = sanitizeForLog({ user: { password: "secret", name: "test" } }) as any;
      expect(result.user.password).toBe("[REDACTED]");
      expect(result.user.name).toBe("test");
    });

    it("passes through arrays and primitives", () => {
      const result = sanitizeForLog({ tags: ["a", "b"], count: 5 });
      expect(result.tags).toEqual(["a", "b"]);
      expect(result.count).toBe(5);
    });
  });

  describe("safeLog", () => {
    it("logs message without data", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      safeLog("hello");
      expect(spy).toHaveBeenCalledWith("hello");
      spy.mockRestore();
    });

    it("logs message with sanitized data", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      safeLog("test", { password: "secret", name: "ok" });
      expect(spy).toHaveBeenCalledWith("test", expect.objectContaining({ password: "[REDACTED]", name: "ok" }));
      spy.mockRestore();
    });
  });

  describe("prepareUserForResponse", () => {
    it("strips password and masks email", () => {
      const result = prepareUserForResponse({
        id: "u1",
        username: "admin",
        email: "admin@example.com",
        password: "hashed-pass",
        role: "ADMIN",
        permissions: '["admin:panel"]',
      });
      expect(result.id).toBe("u1");
      expect(result.username).toBe("admin");
      expect(result.email).toBe("adm***@example.com");
      expect(result.role).toBe("ADMIN");
      expect((result as any).password).toBeUndefined();
      expect((result as any).permissions).toBeUndefined();
    });

    it("handles null email", () => {
      const result = prepareUserForResponse({ id: "u2", username: "user", role: "USER", email: null });
      expect(result.email).toBeNull();
    });
  });

  describe("prepareProductForCustomer", () => {
    it("strips secretData", () => {
      const result = prepareProductForCustomer({
        id: "p1",
        name: "Game Key",
        price: 100,
        category: "Games",
        isSold: false,
        secretData: "XXXX-YYYY-ZZZZ",
      });
      expect(result.name).toBe("Game Key");
      expect((result as any).secretData).toBeUndefined();
    });
  });

  describe("prepareProductForAdmin", () => {
    it("includes hasSecretData but not secretData itself", () => {
      const result = prepareProductForAdmin({
        id: "p1",
        name: "Game Key",
        price: 100,
        category: "Games",
        isSold: false,
        secretData: "XXXX-YYYY-ZZZZ",
        orderId: null,
      });
      expect(result.hasSecretData).toBe(true);
      expect((result as any).secretData).toBeUndefined();
    });

    it("hasSecretData is false when no secretData", () => {
      const result = prepareProductForAdmin({
        id: "p2",
        name: "Item",
        price: 50,
        category: "Others",
        isSold: false,
      });
      expect(result.hasSecretData).toBe(false);
    });
  });
});
