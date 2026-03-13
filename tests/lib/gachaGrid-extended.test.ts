import { describe, it, expect } from "vitest";
import {
  buildGrid,
  findTileIndex,
  hasProductAt,
  getValidSelectors,
  getPathItemProductIds,
  getIntersectionTile,
  getValidLSelectors,
  getValidRSelectorsFor,
  SELECTOR_PATHS,
  INTERSECTION_MAP,
  type GachaProductLite,
} from "@/lib/gachaGrid";

// Full product set covering all tiers
const fullProducts: GachaProductLite[] = [
  { id: "c1", name: "Common 1", price: 100, imageUrl: null, tier: "common" },
  { id: "c2", name: "Common 2", price: 100, imageUrl: null, tier: "common" },
  { id: "c3", name: "Common 3", price: 100, imageUrl: null, tier: "common" },
  { id: "r1", name: "Rare 1", price: 500, imageUrl: null, tier: "rare" },
  { id: "r2", name: "Rare 2", price: 500, imageUrl: null, tier: "rare" },
  { id: "e1", name: "Epic 1", price: 1000, imageUrl: null, tier: "epic" },
  { id: "e2", name: "Epic 2", price: 1000, imageUrl: null, tier: "epic" },
  { id: "l1", name: "Legendary 1", price: 5000, imageUrl: null, tier: "legendary" },
];

describe("gachaGrid - extended coverage", () => {
  const tiles = buildGrid(fullProducts);

  describe("hasProductAt", () => {
    it("returns true for a tile with a product", () => {
      // Row 2, Col 1 should be a common tile with product
      const commonTile = tiles.find((t) => t.type === "common" && t.product);
      if (commonTile) {
        expect(hasProductAt(tiles, commonTile.row, commonTile.col)).toBe(true);
      }
    });

    it("returns false for start tile", () => {
      expect(hasProductAt(tiles, 0, 0)).toBe(false);
    });

    it("returns false for non-existent tile", () => {
      expect(hasProductAt(tiles, 99, 99)).toBe(false);
    });

    it("returns false for selector tile", () => {
      const selectorTile = tiles.find((t) => t.type === "selector");
      if (selectorTile) {
        expect(hasProductAt(tiles, selectorTile.row, selectorTile.col)).toBe(false);
      }
    });
  });

  describe("getValidSelectors", () => {
    it("returns an array of selector labels", () => {
      const selectors = getValidSelectors(tiles);
      expect(Array.isArray(selectors)).toBe(true);
      for (const s of selectors) {
        expect(typeof s).toBe("string");
        expect(s).toMatch(/^[LR]\d$/);
      }
    });

    it("filters selectors that have products on their path", () => {
      const selectors = getValidSelectors(tiles);
      // With full products, most selectors should be valid
      expect(selectors.length).toBeGreaterThan(0);
    });

    it("returns empty for empty products", () => {
      const emptyTiles = buildGrid([]);
      const selectors = getValidSelectors(emptyTiles);
      expect(selectors).toEqual([]);
    });
  });

  describe("getPathItemProductIds", () => {
    it("returns product IDs from a valid path", () => {
      const validSelectors = getValidSelectors(tiles);
      if (validSelectors.length > 0) {
        const ids = getPathItemProductIds(tiles, validSelectors[0]);
        expect(Array.isArray(ids)).toBe(true);
        expect(ids.length).toBeGreaterThan(0);
      }
    });

    it("returns empty for invalid selector label", () => {
      expect(getPathItemProductIds(tiles, "X9")).toEqual([]);
    });

    it("returns empty for path with no products", () => {
      const emptyTiles = buildGrid([]);
      expect(getPathItemProductIds(emptyTiles, "L1")).toEqual([]);
    });
  });

  describe("getIntersectionTile", () => {
    it("returns a tile for valid L/R pair", () => {
      const tile = getIntersectionTile(tiles, "L1", "R1");
      expect(tile).not.toBeNull();
      if (tile) {
        expect(tile.row).toBe(2);
        expect(tile.col).toBe(1);
      }
    });

    it("returns null for invalid pair", () => {
      expect(getIntersectionTile(tiles, "X1", "Y1")).toBeNull();
    });

    it("returns correct tile for L4/R4", () => {
      const tile = getIntersectionTile(tiles, "L4", "R4");
      expect(tile).not.toBeNull();
      if (tile) {
        expect(tile.row).toBe(8);
        expect(tile.col).toBe(0);
        expect(tile.type).toBe("legendary");
      }
    });
  });

  describe("getValidLSelectors", () => {
    it("returns L labels with valid R partners", () => {
      const lSelectors = getValidLSelectors(tiles);
      expect(Array.isArray(lSelectors)).toBe(true);
      for (const l of lSelectors) {
        expect(l).toMatch(/^L\d$/);
      }
    });

    it("has valid selectors when products fill the grid", () => {
      expect(getValidLSelectors(tiles).length).toBeGreaterThan(0);
    });

    it("returns empty for grid with no products", () => {
      const emptyTiles = buildGrid([]);
      expect(getValidLSelectors(emptyTiles)).toEqual([]);
    });
  });

  describe("getValidRSelectorsFor", () => {
    it("returns R labels for given L", () => {
      const rSelectors = getValidRSelectorsFor(tiles, "L1");
      expect(Array.isArray(rSelectors)).toBe(true);
      for (const r of rSelectors) {
        expect(r).toMatch(/^R\d$/);
      }
    });

    it("returns empty for invalid L", () => {
      expect(getValidRSelectorsFor(tiles, "X1")).toEqual([]);
    });

    it("returns empty for grid with no products", () => {
      const emptyTiles = buildGrid([]);
      expect(getValidRSelectorsFor(emptyTiles, "L1")).toEqual([]);
    });
  });

  describe("buildGrid - selector labeling", () => {
    it("assigns L/R labels to selector tiles", () => {
      const selectorTiles = tiles.filter((t) => t.type === "selector");
      const leftSelectors = selectorTiles.filter((t) => t.side === "left");
      const rightSelectors = selectorTiles.filter((t) => t.side === "right");
      expect(leftSelectors.length).toBe(4);
      expect(rightSelectors.length).toBe(4);
    });

    it("labels go L1-L4 and R1-R4", () => {
      const labels = tiles.filter((t) => t.type === "selector").map((t) => t.label).sort();
      expect(labels).toEqual(["L1", "L2", "L3", "L4", "R1", "R2", "R3", "R4"]);
    });
  });

  describe("buildGrid - product assignment", () => {
    it("assigns common products to common tiles", () => {
      const commonTiles = tiles.filter((t) => t.type === "common" && t.product);
      for (const t of commonTiles) {
        expect(t.product!.tier).toBe("common");
      }
    });

    it("assigns rare products to rare tiles", () => {
      const rareTiles = tiles.filter((t) => t.type === "rare" && t.product);
      for (const t of rareTiles) {
        expect(t.product!.tier).toBe("rare");
      }
    });

    it("assigns epic products to epic tiles", () => {
      const epicTiles = tiles.filter((t) => t.type === "epic" && t.product);
      for (const t of epicTiles) {
        expect(t.product!.tier).toBe("epic");
      }
    });

    it("assigns legendary product to legendary tile", () => {
      const legendaryTile = tiles.find((t) => t.type === "legendary");
      expect(legendaryTile?.product?.tier).toBe("legendary");
    });
  });
});
