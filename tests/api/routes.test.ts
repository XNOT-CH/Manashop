import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies BEFORE importing route ──
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
  },
  users: {},
}));

vi.mock("@/lib/auth", () => ({
  isAdmin: vi.fn(),
}));

vi.mock("@/lib/auditLog", () => ({
  auditFromRequest: vi.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    LOGIN: "LOGIN",
    LOGIN_FAILED: "LOGIN_FAILED",
    REGISTER: "REGISTER",
    PRODUCT_CREATE: "PRODUCT_CREATE",
  },
}));

vi.mock("@/lib/api", () => ({
  parseBody: vi.fn(),
  apiSuccess: vi.fn(),
  apiError: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkLoginRateLimit: vi.fn(() => ({ blocked: false, remainingAttempts: 5 })),
  recordFailedLogin: vi.fn(),
  clearLoginAttempts: vi.fn(),
  getClientIp: vi.fn(() => "127.0.0.1"),
  getProgressiveDelay: vi.fn(() => 0),
  sleep: vi.fn(),
  checkRegisterRateLimit: vi.fn(() => ({ blocked: false })),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(() => Promise.resolve("$2a$10$hashedpassword")),
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/utils/date", () => ({
  mysqlNow: vi.fn(() => "2026-01-01 00:00:00"),
}));

vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn((v: string) => `encrypted:${v}`),
  decrypt: vi.fn((v: string) => v.replace("encrypted:", "")),
}));

// Now import the route handlers
import { POST as loginPOST } from "@/app/api/login/route";
import { POST as registerPOST } from "@/app/api/register/route";
import { POST as productPOST } from "@/app/api/products/route";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { parseBody } from "@/lib/api";
import { auditFromRequest } from "@/lib/auditLog";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

function makeRequest(body: Record<string, unknown>, method = "POST"): NextRequest {
  return new NextRequest("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API: /api/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user not found", async () => {
    vi.mocked(parseBody).mockResolvedValue({ data: { username: "nouser", password: "pass123" } });
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

    const res = await loginPOST(makeRequest({ username: "nouser", password: "pass123" }));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns 401 when password is wrong", async () => {
    vi.mocked(parseBody).mockResolvedValue({ data: { username: "testuser", password: "wrongpass" } });
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: "u1", username: "testuser", password: "$2a$10$hash", role: "USER",
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const res = await loginPOST(makeRequest({ username: "testuser", password: "wrongpass" }));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it("returns 200 on successful login", async () => {
    vi.mocked(parseBody).mockResolvedValue({ data: { username: "testuser", password: "correctpass" } });
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: "u1", username: "testuser", password: "$2a$10$hash", role: "USER",
    } as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const res = await loginPOST(makeRequest({ username: "testuser", password: "correctpass" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.user.username).toBe("testuser");
  });

  it("returns error when parseBody fails", async () => {
    const errResponse = new Response(JSON.stringify({ success: false }), { status: 400 });
    vi.mocked(parseBody).mockResolvedValue({ error: errResponse as any });

    const res = await loginPOST(makeRequest({}));
    expect(res.status).toBe(400);
  });
});

describe("API: /api/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup mocks that clearAllMocks resets
    vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) } as any);
    vi.mocked(auditFromRequest).mockResolvedValue(undefined as any);
  });

  it("returns success on valid registration", async () => {
    vi.mocked(parseBody).mockResolvedValue({ data: { username: "newuser", password: "pass123", confirmPassword: "pass123" } });
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

    const res = await registerPOST(makeRequest({ username: "newuser", password: "pass123", confirmPassword: "pass123" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 400 when username exists", async () => {
    vi.mocked(parseBody).mockResolvedValue({ data: { username: "existing", password: "pass123", confirmPassword: "pass123" } });
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: "u1", username: "existing" } as any);

    const res = await registerPOST(makeRequest({ username: "existing", password: "pass123", confirmPassword: "pass123" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns error when parseBody fails", async () => {
    const errResponse = new Response(JSON.stringify({ success: false }), { status: 422 });
    vi.mocked(parseBody).mockResolvedValue({ error: errResponse as any });

    const res = await registerPOST(makeRequest({}));
    expect(res.status).toBe(422);
  });
});

describe("API: /api/products (POST)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup mocks that clearAllMocks resets
    vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) } as any);
    vi.mocked(auditFromRequest).mockResolvedValue(undefined as any);
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(isAdmin).mockResolvedValue({ success: false, error: "Unauthorized" });

    const res = await productPOST(makeRequest({ title: "Game", price: 100, category: "Games" }));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it.skip("creates product when admin (needs full request mock)", async () => {
    vi.mocked(isAdmin).mockResolvedValue({ success: true, userId: "admin1" });

    const res = await productPOST(makeRequest({ title: "Game Key", price: "100", category: "Games" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 400 for missing fields", async () => {
    vi.mocked(isAdmin).mockResolvedValue({ success: true, userId: "admin1" });

    const res = await productPOST(makeRequest({ title: "", price: "", category: "" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 400 for invalid price", async () => {
    vi.mocked(isAdmin).mockResolvedValue({ success: true, userId: "admin1" });

    const res = await productPOST(makeRequest({ title: "Game", price: "-5", category: "Games" }));
    const body = await res.json();
    expect(res.status).toBe(400);
  });

  it("validates discount price < original price", async () => {
    vi.mocked(isAdmin).mockResolvedValue({ success: true, userId: "admin1" });

    const res = await productPOST(makeRequest({ title: "Game", price: "100", discountPrice: "200", category: "Games" }));
    const body = await res.json();
    expect(res.status).toBe(400);
  });
});
