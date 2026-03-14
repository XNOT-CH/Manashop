import { describe, it, expect, vi, beforeEach } from "vitest";

describe("lib/compressImage", () => {
  it("exports compressImage function", async () => {
    const { compressImage } = await import("@/lib/compressImage");
    expect(typeof compressImage).toBe("function");
  });

  it("returns file as-is if size is smaller than max size", async () => {
    const { compressImage } = await import("@/lib/compressImage");
    
    // 100KB file is smaller than default 300KB limit
    const smallFile = new File(["x".repeat(100 * 1024)], "small.jpg", { type: "image/jpeg" });
    const result = await compressImage(smallFile);
    
    expect(result).toBe(smallFile);
  });

  it("returns file as-is if it is not an image", async () => {
    const { compressImage } = await import("@/lib/compressImage");
    const textFile = new File(["x".repeat(400 * 1024)], "text.txt", { type: "text/plain" });
    
    const result = await compressImage(textFile);
    expect(result).toBe(textFile);
  });

  it("throws error if GIF/SVG is larger than 2MB", async () => {
    const { compressImage } = await import("@/lib/compressImage");
    const largeGif = new File(["x".repeat(3 * 1024 * 1024)], "large.gif", { type: "image/gif" });
    
    await expect(compressImage(largeGif)).rejects.toThrow(/GIF/);
    
    const largeSvg = new File(["x".repeat(3 * 1024 * 1024)], "large.svg", { type: "image/svg+xml" });
    await expect(compressImage(largeSvg)).rejects.toThrow(/SVG/);
  });
  
  it("returns GIF/SVG as-is if under 2MB", async () => {
    const { compressImage } = await import("@/lib/compressImage");
    const smallGif = new File(["x".repeat(100 * 1024)], "small.gif", { type: "image/gif" });
    
    const result = await compressImage(smallGif);
    expect(result).toBe(smallGif);
  });
});
