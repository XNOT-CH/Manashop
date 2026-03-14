import { describe, it, expect } from "vitest";
import {
  buildGrid, findTileIndex, hasProductAt, getValidSelectors,
  getPathItemProductIds, getIntersectionTile, getValidLSelectors,
  getValidRSelectorsFor, GRID_DEFINITION, SELECTOR_PATHS, INTERSECTION_MAP,
} from "@/lib/gachaGrid";
import type { GachaProductLite } from "@/lib/gachaGrid";

// ─── sample products ────────────────────────────────────────────────────────
const common = (n: number): GachaProductLite => ({
  id: `c${n}`, name: `Common ${n}`, price: 50, imageUrl: null, tier: "common",
});
const rare = (n: number): GachaProductLite => ({
  id: `r${n}`, name: `Rare ${n}`, price: 200, imageUrl: null, tier: "rare",
});
const epic = (n: number): GachaProductLite => ({
  id: `e${n}`, name: `Epic ${n}`, price: 500, imageUrl: null, tier: "epic",
});
const legendary = (n: number): GachaProductLite => ({
  id: `l${n}`, name: `Legendary ${n}`, price: 1000, imageUrl: null, tier: "legendary",
});

// Full set of products for each tier
const ALL_PRODUCTS = [common(1), common(2), rare(1), rare(2), epic(1), legendary(1)];

describe("lib/gachaGrid", () => {
  // ── GRID_DEFINITION ──────────────────────────────────────────────────────
  describe("GRID_DEFINITION", () => {
    it("has 9 rows", () => {
      expect(GRID_DEFINITION).toHaveLength(9);
    });

    it("row 0 is the start tile", () => {
      expect(GRID_DEFINITION[0]).toEqual(["start"]);
    });

    it("last row is legendary", () => {
      expect(GRID_DEFINITION[8]).toEqual(["legendary"]);
    });
  });

  // ── buildGrid ────────────────────────────────────────────────────────────
  describe("buildGrid", () => {
    it("returns tiles for all grid positions", () => {
      const tiles = buildGrid([]);
      const totalCells = GRID_DEFINITION.reduce((s, r) => s + r.length, 0);
      expect(tiles).toHaveLength(totalCells);
    });

    it("first tile is type 'start'", () => {
      const tiles = buildGrid([]);
      expect(tiles[0]).toMatchObject({ row: 0, col: 0, type: "start" });
    });

    it("selector tiles have 'left' or 'right' side and a label", () => {
      const tiles = buildGrid([]);
      const selectors = tiles.filter((t) => t.type === "selector");
      selectors.forEach((t) => {
        expect(t.side).toMatch(/^(left|right)$/);
        expect(t.label).toMatch(/^[LR][1-4]$/);
      });
    });

    it("generates L1-L4 and R1-R4 selectors", () => {
      const tiles = buildGrid([]);
      const labels = tiles.filter((t) => t.label).map((t) => t.label);
      ["L1", "L2", "L3", "L4", "R1", "R2", "R3", "R4"].forEach((lbl) => {
        expect(labels).toContain(lbl);
      });
    });

    it("assigns products to matching tier tiles", () => {
      const tiles = buildGrid(ALL_PRODUCTS);
      const commonTiles = tiles.filter((t) => t.type === "common");
      const withProduct = commonTiles.filter((t) => t.product);
      expect(withProduct.length).toBeGreaterThan(0);
      withProduct.forEach((t) => {
        expect(t.product?.tier).toBe("common");
      });
    });

    it("legendary tile gets legendary product", () => {
      const tiles = buildGrid(ALL_PRODUCTS);
      const leg = tiles.find((t) => t.type === "legendary");
      expect(leg?.product?.tier).toBe("legendary");
    });

    it("tiles remain empty when no products for that tier", () => {
      // Only legendary product — common/rare/epic tiles should have no product
      const tiles = buildGrid([legendary(1)]);
      const commonTiles = tiles.filter((t) => t.type === "common");
      commonTiles.forEach((t) => {
        expect(t.product).toBeUndefined();
      });
    });

    it("wraps around product pool via modulo", () => {
      // Only 1 common product but multiple common tiles
      const tiles = buildGrid([common(1)]);
      const commonTiles = tiles.filter((t) => t.type === "common");
      commonTiles.forEach((t) => {
        expect(t.product?.id).toBe("c1"); // all get same product via wrap
      });
    });
  });

  // ── findTileIndex ────────────────────────────────────────────────────────
  describe("findTileIndex", () => {
    it("returns correct index for existing tile", () => {
      const tiles = buildGrid([]);
      const idx = findTileIndex(tiles, 0, 0);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(tiles[idx]).toMatchObject({ row: 0, col: 0 });
    });

    it("returns -1 for non-existing tile", () => {
      const tiles = buildGrid([]);
      expect(findTileIndex(tiles, 99, 99)).toBe(-1);
    });
  });

  // ── hasProductAt ─────────────────────────────────────────────────────────
  describe("hasProductAt", () => {
    it("returns true when tile has a product", () => {
      const tiles = buildGrid(ALL_PRODUCTS);
      // legendary is at row 8, col 0
      expect(hasProductAt(tiles, 8, 0)).toBe(true);
    });

    it("returns false when tile has no product", () => {
      // No products provided → all product tiles empty
      const tiles = buildGrid([]);
      expect(hasProductAt(tiles, 8, 0)).toBe(false);
    });

    it("returns false when tile doesn't exist", () => {
      const tiles = buildGrid([]);
      expect(hasProductAt(tiles, 99, 0)).toBe(false);
    });
  });

  // ── getValidSelectors ────────────────────────────────────────────────────
  describe("getValidSelectors", () => {
    it("returns empty when no products", () => {
      const tiles = buildGrid([]);
      expect(getValidSelectors(tiles)).toEqual([]);
    });

    it("returns selector labels when products exist along paths", () => {
      const tiles = buildGrid(ALL_PRODUCTS);
      const valid = getValidSelectors(tiles);
      expect(Array.isArray(valid)).toBe(true);
      valid.forEach((label) => {
        expect(label).toMatch(/^[LR][1-4]$/);
      });
    });
  });

  // ── getPathItemProductIds ─────────────────────────────────────────────────
  describe("getPathItemProductIds", () => {
    it("returns product ids along a selector path", () => {
      const tiles = buildGrid(ALL_PRODUCTS);
      const ids = getPathItemProductIds(tiles, "L1");
      expect(Array.isArray(ids)).toBe(true);
    });

    it("returns empty array for unknown selector", () => {
      const tiles = buildGrid(ALL_PRODUCTS);
      const ids = getPathItemProductIds(tiles, "UNKNOWN");
      expect(ids).toEqual([]);
    });

    it("returns empty array when no products on path", () => {
      const tiles = buildGrid([]); // no products
      const ids = getPathItemProductIds(tiles, "R4");
      expect(ids).toEqual([]);
    });
  });

  // ── getIntersectionTile ───────────────────────────────────────────────────
  describe("getIntersectionTile", () => {
    it("returns the tile at L1/R1 intersection", () => {
      const tiles = buildGrid(ALL_PRODUCTS);
      const tile = getIntersectionTile(tiles, "L1", "R1");
      expect(tile).not.toBeNull();
      expect(tile?.row).toBe(2);
      expect(tile?.col).toBe(1);
    });

    it("returns null for unknown lLabel", () => {
      const tiles = buildGrid([]);
      expect(getIntersectionTile(tiles, "UNKNOWN", "R1")).toBeNull();
    });

    it("returns null for unknown rLabel", () => {
      const tiles = buildGrid([]);
      expect(getIntersectionTile(tiles, "L1", "UNKNOWN")).toBeNull();
    });

    it("covers all L/R combinations in INTERSECTION_MAP", () => {
      const tiles = buildGrid([]);
      ["L1", "L2", "L3", "L4"].forEach((l) => {
        ["R1", "R2", "R3", "R4"].forEach((r) => {
          // should not throw
          const tile = getIntersectionTile(tiles, l, r);
          expect(tile === null || typeof tile === "object").toBe(true);
        });
      });
    });
  });

  // ── getValidLSelectors ───────────────────────────────────────────────────
  describe("getValidLSelectors", () => {
    it("returns empty array when no products", () => {
      const tiles = buildGrid([]);
      expect(getValidLSelectors(tiles)).toEqual([]);
    });

    it("returns L labels when corresponding intersection has product", () => {
      const tiles = buildGrid(ALL_PRODUCTS);
      const valid = getValidLSelectors(tiles);
      valid.forEach((lbl) => {
        expect(lbl).toMatch(/^L[1-4]$/);
      });
    });
  });

  // ── getValidRSelectorsFor ────────────────────────────────────────────────
  describe("getValidRSelectorsFor", () => {
    it("returns empty array when no products", () => {
      const tiles = buildGrid([]);
      expect(getValidRSelectorsFor(tiles, "L1")).toEqual([]);
    });

    it("returns array of R labels for a given L", () => {
      const tiles = buildGrid(ALL_PRODUCTS);
      const valid = getValidRSelectorsFor(tiles, "L4");
      expect(Array.isArray(valid)).toBe(true);
      valid.forEach((r) => expect(r).toMatch(/^R[1-4]$/));
    });
  });
});
