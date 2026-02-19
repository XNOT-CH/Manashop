"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showError } from "@/lib/swal";
import { GachaResultModal } from "@/components/GachaResultModal";
import {
    buildGrid,
    findTileIndex,
    GRID_DEFINITION,
    SELECTOR_PATHS,
    type TileType,
    type GachaProductLite,
} from "@/lib/gachaGrid";

type Phase = "idle" | "selectRow" | "scanning" | "result";

// --- Tier Colors ---
const tierColors: Record<TileType, string> = {
    start: "ring-zinc-800 dark:ring-zinc-400",
    selector: "ring-white dark:ring-zinc-300",
    common: "ring-orange-500", rare: "ring-green-500",
    epic: "ring-blue-500", legendary: "ring-red-500",
};
const tierGlow: Record<TileType, string> = {
    start: "", selector: "",
    common: "shadow-orange-500/40", rare: "shadow-green-500/40",
    epic: "shadow-blue-500/40", legendary: "shadow-red-500/40",
};
const tierBg: Record<TileType, string> = {
    start: "bg-zinc-800 dark:bg-zinc-600", selector: "bg-white dark:bg-zinc-300",
    common: "bg-orange-500/20", rare: "bg-green-500/20",
    epic: "bg-blue-500/20", legendary: "bg-red-500/20",
};
const tierLabels: Record<TileType, string> = {
    start: "", selector: "", common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary",
};

// --- Component ---
interface GachaRhombusProps {
    products: GachaProductLite[];
    settings: { isEnabled: boolean; costType: string; costAmount: number; dailySpinLimit: number };
}

export function GachaRhombus({ products, settings }: GachaRhombusProps) {
    const tiles = useMemo(() => buildGrid(products), [products]);
    const [phase, setPhase] = useState<Phase>("idle");
    const [highlightedTile, setHighlightedTile] = useState<number | null>(null);
    const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
    const [pathTiles, setPathTiles] = useState<number[]>([]);
    const [resultProduct, setResultProduct] = useState<GachaProductLite | null>(null);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { return () => { if (intervalRef.current) clearTimeout(intervalRef.current); }; }, []);

    const startScanning = useCallback((label: string, targetProductId: string) => {
        setPhase("scanning");
        const path = SELECTOR_PATHS[label] || [];
        const pathIndices = path.map(([r, c]) => findTileIndex(tiles, r, c)).filter((i) => i >= 0);
        setPathTiles(pathIndices);

        // Items with products on this path
        const itemsOnPath = pathIndices.filter((i) => tiles[i].product);
        if (itemsOnPath.length === 0) { setPhase("idle"); return; }

        const targetIndex = itemsOnPath.find((i) => tiles[i].product?.id === targetProductId) ?? itemsOnPath[0];

        // Trace down the path one by one, then cycle through items
        let step = 0;
        const traceSteps = pathIndices.length;
        const extraCycles = 4 + Math.floor(Math.random() * 4);
        const totalSteps = traceSteps + extraCycles;

        const scan = () => {
            if (step < traceSteps) {
                // Trace: highlight each tile in path sequentially
                setHighlightedTile(pathIndices[step]);
            } else {
                // Cycle through only item tiles on this path
                const cycleIdx = (step - traceSteps) % itemsOnPath.length;
                setHighlightedTile(itemsOnPath[cycleIdx]);
            }
            step++;

            if (step >= totalSteps) {
                const finalTile = tiles[targetIndex];
                setHighlightedTile(targetIndex);
                setTimeout(() => {
                    if (finalTile.product) { setResultProduct(finalTile.product); setPhase("result"); }
                }, 600);
                return;
            }
            const delay = step < traceSteps ? 250 : 120 + (step - traceSteps) * 40;
            intervalRef.current = setTimeout(scan, delay);
        };
        intervalRef.current = setTimeout(scan, 300);
    }, [tiles]);

    const startRollFromServer = useCallback(async () => {
        if (phase !== "idle") return;

        setPhase("selectRow");
        setResultProduct(null);
        setSelectedLabel(null);
        setPathTiles([]);

        try {
            const res = await fetch("/api/gacha/roll", { method: "POST" });
            const data = await res.json();
            if (!res.ok || !data.success) {
                showError(data.message || "สุ่มไม่สำเร็จ");
                setPhase("idle");
                setHighlightedTile(null);
                return;
            }

            const selectorLabel = data.data?.selectorLabel as string | undefined;
            const product = data.data?.product as GachaProductLite | undefined;

            if (!selectorLabel || !product?.id) {
                showError("ข้อมูลสุ่มไม่ครบถ้วน");
                setPhase("idle");
                setHighlightedTile(null);
                return;
            }

            const selectorTileIndex = tiles.findIndex((t) => t.type === "selector" && t.label === selectorLabel);
            if (selectorTileIndex < 0) {
                showError("ไม่พบแถวที่สุ่มได้ในกริด");
                setPhase("idle");
                setHighlightedTile(null);
                return;
            }

            setHighlightedTile(selectorTileIndex);
            setSelectedLabel(selectorLabel);
            setTimeout(() => startScanning(selectorLabel, product.id), 800);
        } catch {
            showError("เกิดข้อผิดพลาดในการสุ่ม");
            setPhase("idle");
            setHighlightedTile(null);
        }
    }, [phase, tiles, startScanning]);

    const handleSpin = () => {
        if (phase !== "idle") return;
        void startRollFromServer();
    };
    const handleSpinAgain = () => {
        setResultProduct(null); setPhase("idle"); setHighlightedTile(null);
        setSelectedLabel(null); setPathTiles([]);
        setTimeout(() => void startRollFromServer(), 200);
    };
    const handleCloseResult = () => {
        setResultProduct(null); setPhase("idle"); setHighlightedTile(null);
        setSelectedLabel(null); setPathTiles([]);
    };

    // --- Layout ---
    const spacingX = 110, spacingY = 44, tileSize = 56;
    const maxRowSize = Math.max(...GRID_DEFINITION.map((r) => r.length));
    const gridWidth = (maxRowSize - 1) * spacingX + tileSize;
    const gridHeight = (GRID_DEFINITION.length - 1) * spacingY + tileSize;

    function getTilePosition(row: number, col: number) {
        const rowSize = GRID_DEFINITION[row].length;
        const offsetX = (maxRowSize - rowSize) * (spacingX / 2);
        return { x: offsetX + col * spacingX, y: row * spacingY };
    }

    const isSpinning = phase === "selectRow" || phase === "scanning";

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="relative mx-auto" style={{ width: gridWidth, height: gridHeight }}>
                {tiles.map((tile, index) => {
                    const pos = getTilePosition(tile.row, tile.col);
                    const isHighlighted = highlightedTile === index;
                    const isItemTile = tile.type !== "start" && tile.type !== "selector";
                    const isOnPath = pathTiles.includes(index);
                    const isSelectorSelected = tile.type === "selector" && tile.label === selectedLabel;
                    const isDimmed = phase === "scanning" && isItemTile && !isOnPath;

                    return (
                        <motion.div
                            key={index}
                            className="absolute"
                            style={{ left: pos.x, top: pos.y, width: tileSize, height: tileSize }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.02, type: "spring", stiffness: 300 }}
                        >
                            <div className={`
                                relative w-full h-full rounded-full overflow-hidden
                                ring-2 ${tierColors[tile.type]} transition-all duration-300
                                ${isHighlighted ? `ring-4 shadow-lg ${tierGlow[tile.type]} gacha-pulse` : ""}
                                ${isSelectorSelected ? "ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/40" : ""}
                                ${isDimmed ? "opacity-20 scale-90" : ""}
                                ${isOnPath && !isHighlighted ? "ring-3 ring-yellow-400/40" : ""}
                                ${tile.type !== "selector" && !isItemTile && !isHighlighted && !isSelectorSelected ? "opacity-70" : ""}
                            `}>
                                {tile.type === "start" && (
                                    <div className="w-full h-full bg-zinc-800 dark:bg-zinc-600 flex items-center justify-center">
                                        <Dices className="h-6 w-6 text-white" />
                                    </div>
                                )}
                                {tile.type === "selector" && (
                                    <div className={`
                                        w-full h-full flex items-center justify-center
                                        bg-gradient-to-br from-violet-500 to-indigo-600
                                        ${isSelectorSelected ? "from-yellow-400 to-orange-500" : ""}
                                        ${isHighlighted ? "from-yellow-400 to-orange-500" : ""}
                                    `}>
                                        <span className="text-[11px] font-extrabold text-white drop-shadow">{tile.label}</span>
                                    </div>
                                )}
                                {isItemTile && tile.product && (
                                    tile.product.imageUrl ? (
                                        <img src={tile.product.imageUrl} alt={tile.product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full ${tierBg[tile.type]} flex items-center justify-center`}>
                                            <span className="text-lg">🎁</span>
                                        </div>
                                    )
                                )}
                                {isItemTile && !tile.product && (
                                    <div className={`w-full h-full ${tierBg[tile.type]} flex items-center justify-center`}>
                                        <span className="text-xs text-muted-foreground">?</span>
                                    </div>
                                )}
                                {isHighlighted && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-yellow-300"
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                                        transition={{ duration: 0.6, repeat: Infinity }}
                                    />
                                )}
                            </div>
                            {isItemTile && tile.product && (
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-muted-foreground bg-card/80 px-1.5 py-0.5 rounded-full border border-border">
                                        {tile.product.name.substring(0, 12)}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-2">
                {(["common", "rare", "epic", "legendary"] as const).map((tier) => (
                    <Badge key={tier} variant="outline" className={`gap-1.5 text-xs ${tierColors[tier]} bg-card`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${tier === "common" ? "bg-orange-500" : tier === "rare" ? "bg-green-500"
                            : tier === "epic" ? "bg-blue-500" : "bg-red-500"
                            }`} />
                        {tierLabels[tier]}
                    </Badge>
                ))}
            </div>

            {/* Spin */}
            <div className="flex flex-col items-center gap-3">
                <Button onClick={handleSpin} disabled={isSpinning || !settings.isEnabled}
                    size="lg" className="gap-2 rounded-xl px-8 text-lg font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow">
                    {isSpinning ? (<><Loader2 className="h-5 w-5 animate-spin" />กำลังสุ่ม...</>) : (<><Dices className="h-5 w-5" />สุ่มเลย!</>)}
                </Button>
            </div>

            <AnimatePresence>
                {phase === "result" && resultProduct && (
                    <GachaResultModal product={resultProduct} onClose={handleCloseResult} onSpinAgain={handleSpinAgain} />
                )}
            </AnimatePresence>
        </div>
    );
}
