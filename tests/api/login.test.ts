import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    query: { users: { findFirst: vi.fn() } },
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
  },
  users: { username: "username", id: "id" },
}));

vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

vi.mock("@/lib/rateLimit", () => ({
  checkLoginRateLimit: vi.fn().mockReturnValue({ blocked: false }),
  recordFailedLogin: vi.fn(),
  clearLoginAttempts: vi.fn(),
  getClientIp: vi.fn(() => "127.0.0.1"),
  getProgressiveDelay: vi.fn(() => 0),
  sleep: vi.fn(),
}));

vi.mock("@/lib/auditLog", () => ({
  auditFromRequest: vi.fn(),
  AUDIT_ACTIONS: { LOGIN: "LOGIN", LOGIN_FAILED: "LOGIN_FAILED" },
}));

vi.mock("@/lib/api", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/validations", () => ({
  loginSchema: {},
}));

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkLoginRateLimit } from "@/lib/rateLimit";
import { parseBody } from "@/lib/api";

describe("API: /api/login (POST)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (parseBody as any).mockResolvedValue({ data: { username: "testuser", password: "pass123" } });
    (checkLoginRateLimit as any).mockReturnValue({ blocked: false, remainingAttempts: 5 });
  });

  const createRequest = () =>
    new NextRequest("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify({ username: "testuser", password: "pass123" }),
    });

  it("returns validation error if parseBody fails", async () => {
    const errorRes = new Response(JSON.stringify({ success: false }), { status: 422 });
    (parseBody as any).mockResolvedValue({ error: errorRes });

    const { POST } = await import("@/app/api/login/route");
    const res = await POST(createRequest());
    expect(res.status).toBe(422);
  });

  it("returns 429 when rate limited", async () => {
    (checkLoginRateLimit as any).mockReturnValue({ blocked: true, message: "Too many attempts" });

    const { POST } = await import("@/app/api/login/route");
    const res = await POST(createRequest());
    expect(res.status).toBe(429);
  });

  it("returns 401 when user not found", async () => {
    (db.query.users.findFirst as any).mockResolvedValue(null);

    const { POST } = await import("@/app/api/login/route");
    const res = await POST(createRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 when password is wrong", async () => {
    (db.query.users.findFirst as any).mockResolvedValue({
      id: "u1", username: "testuser", password: "hashed", role: "USER",
    });
    (bcrypt.compare as any).mockResolvedValue(false);

    const { POST } = await import("@/app/api/login/route");
    const res = await POST(createRequest());
    expect(res.status).toBe(401);
  });

  it("returns success on valid credentials", async () => {
    (db.query.users.findFirst as any).mockResolvedValue({
      id: "u1", username: "testuser", password: "hashed", role: "USER",
    });
    (bcrypt.compare as any).mockResolvedValue(true);

    const { POST } = await import("@/app/api/login/route");
    const res = await POST(createRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.username).toBe("testuser");
  });
});
