import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: { users: { findFirst: vi.fn() } },
  },
  users: { id: "id" },
}));

vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));

import { auth } from "@/auth";
import { db } from "@/lib/db";

describe("API: /api/profile (GET)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    (auth as any).mockResolvedValue(null);
    const { GET } = await import("@/app/api/profile/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when user not found", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1" } });
    (db.query.users.findFirst as any).mockResolvedValue(null);
    const { GET } = await import("@/app/api/profile/route");
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns user profile successfully", async () => {
    (auth as any).mockResolvedValue({ user: { id: "u1" } });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: "u1",
      username: "testuser",
      creditBalance: 500,
      role: "USER",
    });
    const { GET } = await import("@/app/api/profile/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe("testuser");
    expect(body.data.creditBalance).toBe("500");
  });
});
