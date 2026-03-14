import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSessionToken, createSession, validateSession, destroySession, destroyAllUserSessions, getCurrentSession, regenerateSession } from "@/lib/session";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    query: {
      sessions: {
        findFirst: vi.fn(),
      }
    },
    delete: vi.fn().mockReturnValue({ where: vi.fn() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
  },
  sessions: {
    token: "token",
    userId: "userId",
  }
}));

describe("lib/session", () => {
  let mockCookies: any;
  
  beforeEach(() => {
    mockCookies = {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    };
    (cookies as any).mockResolvedValue(mockCookies);
  });

  describe("generateSessionToken", () => {
    it("generates a random token", () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      
      expect(token1).toHaveLength(128); // 64 bytes hex = 128 chars
      expect(token1).not.toBe(token2);
    });
  });

  describe("createSession", () => {
    it("creates a session and sets cookie", async () => {
      const userId = "user-123";
      
      const token = await createSession(userId);
      
      // Should insert into DB
      expect(db.insert).toHaveBeenCalledTimes(1);
      
      // Should set cookie
      expect(mockCookies.set).toHaveBeenCalledTimes(1);
      expect(mockCookies.set).toHaveBeenCalledWith(
        "session_token",
        token,
        expect.objectContaining({
          httpOnly: true,
          sameSite: "strict",
          path: "/",
        })
      );
    });

    it("sets longer expiry for rememberMe", async () => {
      const userId = "user-123";
      vi.useFakeTimers();
      
      await createSession(userId, true);
      
      const cookieCallArgs = mockCookies.set.mock.calls[0][2];
      const expiry = cookieCallArgs.expires;
      
      // remember me sets expiry to 7 days
      const expectedExpiry = new Date();
      expectedExpiry.setDate(expectedExpiry.getDate() + 7);
      
      expect(expiry.getTime()).toBeCloseTo(expectedExpiry.getTime(), -3);
      
      vi.useRealTimers();
    });
  });

  describe("validateSession", () => {
    it("returns null if no cookie", async () => {
      mockCookies.get.mockReturnValue(undefined);
      const result = await validateSession();
      expect(result).toBeNull();
    });

    it("returns null if session not in db", async () => {
      mockCookies.get.mockReturnValue({ value: "fake-token" });
      (db.query.sessions.findFirst as any).mockResolvedValue(null);
      
      const result = await validateSession();
      expect(result).toBeNull();
    });

    it("deletes session and returns null if expired", async () => {
      const token = "expired-token";
      mockCookies.get.mockReturnValue({ value: token });
      
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      
      (db.query.sessions.findFirst as any).mockResolvedValue({
        token,
        userId: "user-123",
        expiresAt: pastDate.toISOString(),
        lastActivity: new Date().toISOString()
      });
      
      const result = await validateSession();
      
      expect(result).toBeNull();
      expect(db.delete).toHaveBeenCalled();
      expect(mockCookies.delete).toHaveBeenCalledWith("session_token");
    });

    it("deletes session and returns null if idle out", async () => {
      const token = "idle-token";
      mockCookies.get.mockReturnValue({ value: token });
      
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      
      // Last activity 3 hours ago (idle timeout is 2 hours)
      const pastActivity = new Date();
      pastActivity.setHours(pastActivity.getHours() - 3);
      
      (db.query.sessions.findFirst as any).mockResolvedValue({
        token,
        userId: "user-123",
        expiresAt: futureDate.toISOString(),
        lastActivity: pastActivity.toISOString()
      });
      
      const result = await validateSession();
      
      expect(result).toBeNull();
    });

    it("validates session successfully and updates last activity", async () => {
      const token = "valid-token";
      const userId = "user-123";
      mockCookies.get.mockReturnValue({ value: token });
      
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      
      (db.query.sessions.findFirst as any).mockResolvedValue({
        token,
        userId,
        expiresAt: futureDate.toISOString(),
        lastActivity: new Date().toISOString()
      });
      
      const result = await validateSession();
      
      expect(result).toBe(userId);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("destroySession", () => {
    it("destroys provided token", async () => {
      const token = "token-to-destroy";
      await destroySession(token);
      
      expect(db.delete).toHaveBeenCalled();
      expect(mockCookies.delete).toHaveBeenCalledWith("session_token");
    });

    it("destroys token from cookies if not provided", async () => {
      const token = "cookie-token";
      mockCookies.get.mockReturnValue({ value: token });
      
      await destroySession();
      
      expect(db.delete).toHaveBeenCalled();
      expect(mockCookies.delete).toHaveBeenCalledWith("session_token");
    });
  });

  describe("destroyAllUserSessions", () => {
    it("deletes all sessions for user", async () => {
      const userId = "user-123";
      await destroyAllUserSessions(userId);
      
      expect(db.delete).toHaveBeenCalled();
      expect(mockCookies.delete).toHaveBeenCalledWith("session_token");
    });
  });

  describe("getCurrentSession", () => {
    it("returns null if no token", async () => {
      mockCookies.get.mockReturnValue(undefined);
      const result = await getCurrentSession();
      expect(result).toBeNull();
    });

    it("returns full session object with user if valid", async () => {
      const token = "valid-token";
      const sessionData = {
        token,
        userId: "user-123",
        user: { id: "user-123", username: "testuser", role: "USER" }
      };
      
      mockCookies.get.mockReturnValue({ value: token });
      (db.query.sessions.findFirst as any).mockResolvedValue(sessionData);
      
      const result = await getCurrentSession();
      expect(result).toEqual(sessionData);
    });
  });
  
  describe("regenerateSession", () => {
    it("deletes old session and creates new one", async () => {
      const userId = "user-123";
      await regenerateSession(userId);
      
      expect(db.delete).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });
  });
});
