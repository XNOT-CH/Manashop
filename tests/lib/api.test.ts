import { describe, it, expect } from "vitest";
import { z } from "zod";
import { apiSuccess, apiError, parseBody } from "@/lib/api";

// Helper to create a mock Request with JSON body
function mockRequest(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockBadRequest(): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not json{{{",
  });
}

describe("api response helpers", () => {
  describe("apiSuccess", () => {
    it("returns JSON with success: true", async () => {
      const res = apiSuccess({ items: [1, 2, 3] });
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.items).toEqual([1, 2, 3]);
    });

    it("includes optional message", async () => {
      const res = apiSuccess("ok", "Created!");
      const body = await res.json();
      expect(body.message).toBe("Created!");
    });

    it("uses custom status code", async () => {
      const res = apiSuccess(null, "Created", 201);
      expect(res.status).toBe(201);
    });

    it("defaults to 200", () => {
      const res = apiSuccess(null);
      expect(res.status).toBe(200);
    });
  });

  describe("apiError", () => {
    it("returns JSON with success: false", async () => {
      const res = apiError("Something went wrong");
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.message).toBe("Something went wrong");
    });

    it("uses custom status code", () => {
      const res = apiError("Not found", 404);
      expect(res.status).toBe(404);
    });

    it("defaults to 400", () => {
      const res = apiError("Bad request");
      expect(res.status).toBe(400);
    });

    it("includes error map when provided", async () => {
      const res = apiError("Validation failed", 422, { name: ["Required"] });
      const body = await res.json();
      expect(body.errors).toEqual({ name: ["Required"] });
    });
  });
});

describe("parseBody", () => {
  const testSchema = z.object({
    name: z.string().min(1, "Name required"),
    age: z.number().min(0),
  });

  it("returns data on valid input", async () => {
    const result = await parseBody(mockRequest({ name: "Alice", age: 25 }), testSchema);
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.name).toBe("Alice");
      expect(result.data.age).toBe(25);
    }
  });

  it("returns error for invalid JSON", async () => {
    const result = await parseBody(mockBadRequest(), testSchema);
    expect("error" in result).toBe(true);
  });

  it("returns error for validation failure", async () => {
    const result = await parseBody(mockRequest({ name: "" }), testSchema);
    expect("error" in result).toBe(true);
  });

  it("returns 422 for validation errors", async () => {
    const result = await parseBody(mockRequest({ name: 123 }), testSchema);
    if ("error" in result) {
      expect(result.error.status).toBe(422);
    }
  });

  it("returns errors object with field keys", async () => {
    const result = await parseBody(mockRequest({}), testSchema);
    if ("error" in result) {
      const body = await result.error.json();
      expect(body.errors).toBeDefined();
    }
  });
});
