import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";

describe("lib/csrf", () => {
  let mockCookies: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies = {
      set: vi.fn(),
      get: vi.fn(),
    };
    (cookies as any).mockResolvedValue(mockCookies);
  });

  describe("generateCsrfToken", () => {
    it("generates a random hex token", async () => {
      const { generateCsrfToken } = await import("@/lib/csrf");
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      
      expect(token1).toHaveLength(64); // 32 bytes hex
      expect(token1).not.toBe(token2);
    });
  });

  describe("createCsrfTokenPair", () => {
    it("returns token and sets cookie", async () => {
      const { createCsrfTokenPair } = await import("@/lib/csrf");
      const result = await createCsrfTokenPair();
      
      expect(result.token).toHaveLength(64);
      expect(result.cookieValue).toBeTruthy();
      expect(mockCookies.set).toHaveBeenCalledWith(
        "csrf_cookie",
        result.cookieValue,
        expect.objectContaining({
          httpOnly: true,
          sameSite: "strict",
          path: "/",
        })
      );
    });
  });

  describe("validateCsrfToken", () => {
    it("returns false for empty token", async () => {
      const { validateCsrfToken } = await import("@/lib/csrf");
      const result = await validateCsrfToken("");
      expect(result).toBe(false);
    });

    it("returns false if no cookie", async () => {
      mockCookies.get.mockReturnValue(undefined);
      const { validateCsrfToken } = await import("@/lib/csrf");
      const result = await validateCsrfToken("some-token");
      expect(result).toBe(false);
    });

    it("validates correctly with matching token/cookie pair", async () => {
      const { createCsrfTokenPair, validateCsrfToken } = await import("@/lib/csrf");
      const { token, cookieValue } = await createCsrfTokenPair();
      
      // Simulate the cookie being set
      mockCookies.get.mockReturnValue({ value: cookieValue });
      
      const result = await validateCsrfToken(token);
      expect(result).toBe(true);
    });

    it("returns false for mismatched token", async () => {
      const { createCsrfTokenPair, validateCsrfToken } = await import("@/lib/csrf");
      const { cookieValue } = await createCsrfTokenPair();
      mockCookies.get.mockReturnValue({ value: cookieValue });
      
      const result = await validateCsrfToken("wrong-token");
      expect(result).toBe(false);
    });
  });

  describe("getCsrfTokenFromRequest", () => {
    it("returns token from X-CSRF-Token header", async () => {
      const { getCsrfTokenFromRequest } = await import("@/lib/csrf");
      const req = new Request("http://localhost", {
        headers: { "X-CSRF-Token": "my-csrf-token" },
      });
      expect(getCsrfTokenFromRequest(req)).toBe("my-csrf-token");
    });

    it("returns null if no header", async () => {
      const { getCsrfTokenFromRequest } = await import("@/lib/csrf");
      const req = new Request("http://localhost");
      expect(getCsrfTokenFromRequest(req)).toBeNull();
    });
  });
});
