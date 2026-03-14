import { describe, it, expect, vi, afterEach } from "vitest";
import { mysqlNow } from "@/lib/utils/date";

describe("lib/utils/date", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns formatted date string", () => {
    // Mock system time to a fixed date
    const date = new Date(2026, 2, 13, 16, 20, 0); // March 13, 2026 16:20:00 (local time)
    vi.useFakeTimers();
    vi.setSystemTime(date);

    const result = mysqlNow();
    
    // Check format (YYYY-MM-DD HH:MM:SS)
    // Note: new Date().toISOString() returns UTC time, so we test the RegExp format
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    
    // Also test specific date output for the mocked time
    const expected = date.toISOString().slice(0, 19).replace("T", " ");
    expect(result).toBe(expected);
  });
});
