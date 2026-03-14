import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  signOut: vi.fn(),
}));

import { signOut } from "@/auth";

describe("API: /api/logout (POST)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs out successfully", async () => {
    (signOut as any).mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/logout/route");
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 on error", async () => {
    (signOut as any).mockRejectedValue(new Error("Logout failed"));
    const { POST } = await import("@/app/api/logout/route");
    const res = await POST();
    expect(res.status).toBe(500);
  });
});
