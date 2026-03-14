import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/csrf", () => ({
  createCsrfTokenPair: vi.fn(),
}));

import { createCsrfTokenPair } from "@/lib/csrf";

describe("API: /api/csrf (GET)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns CSRF token", async () => {
    (createCsrfTokenPair as any).mockResolvedValue({ token: "csrf-test-token" });

    const { GET } = await import("@/app/api/csrf/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.csrfToken).toBe("csrf-test-token");
  });

  it("returns 500 on error", async () => {
    (createCsrfTokenPair as any).mockRejectedValue(new Error("Token error"));

    const { GET } = await import("@/app/api/csrf/route");
    const res = await GET();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
