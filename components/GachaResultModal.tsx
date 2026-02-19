"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GachaProduct {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    tier: "common" | "rare" | "epic" | "legendary";
}

interface GachaResultModalProps {
    product: GachaProduct;
    onClose: () => void;
    onSpinAgain: () => void;
}

const tierConfig = {
    common: {
        label: "ธรรมดา (Common)",
        color: "bg-orange-500",
        textColor: "text-orange-500",
        borderColor: "border-orange-500",
        glowColor: "shadow-orange-500/50",
        emoji: "🟠",
    },
    rare: {
        label: "หายาก (Rare)",
        color: "bg-green-500",
        textColor: "text-green-500",
        borderColor: "border-green-500",
        glowColor: "shadow-green-500/50",
        emoji: "🟢",
    },
    epic: {
        label: "หายากมาก (Epic)",
        color: "bg-blue-500",
        textColor: "text-blue-500",
        borderColor: "border-blue-500",
        glowColor: "shadow-blue-500/50",
        emoji: "🔵",
    },
    legendary: {
        label: "ตำนาน (Legendary)",
        color: "bg-red-500",
        textColor: "text-red-500",
        borderColor: "border-red-500",
        glowColor: "shadow-red-500/50",
        emoji: "🔴",
    },
};

export function GachaResultModal({ product, onClose, onSpinAgain }: GachaResultModalProps) {
    const tier = tierConfig[product.tier];

    const [confetti, setConfetti] = useState<
        Array<{
            key: number;
            left: string;
            animationDelay: string;
            animationDuration: string;
            backgroundColor: string;
        }>
    >([]);

    useEffect(() => {
        const colors = [
            "#f97316",
            "#22c55e",
            "#3b82f6",
            "#ef4444",
            "#a855f7",
            "#eab308",
            "#ec4899",
        ];

        setConfetti(
            Array.from({ length: 30 }).map((_, i) => ({
                key: i,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            }))
        );
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />

                {/* Confetti particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {confetti.map((c) => (
                        <div
                            key={c.key}
                            className="gacha-confetti"
                            style={{
                                left: c.left,
                                animationDelay: c.animationDelay,
                                animationDuration: c.animationDuration,
                                backgroundColor: c.backgroundColor,
                            }}
                        />
                    ))}
                </div>

                {/* Modal Content */}
                <motion.div
                    className="relative z-10 w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
                    initial={{ scale: 0.5, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {/* Tier Banner */}
                    <div className={`${tier.color} py-3 text-center text-white relative overflow-hidden`}>
                        <motion.div
                            className="absolute inset-0 bg-white/10"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                            style={{ width: "50%", skewX: "-15deg" }}
                        />
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            <span className="font-bold text-lg">{tier.emoji} {tier.label}</span>
                            <Sparkles className="h-5 w-5" />
                        </div>
                    </div>

                    {/* Product Image */}
                    <div className="p-6 flex flex-col items-center">
                        <motion.div
                            className={`relative w-40 h-40 rounded-full overflow-hidden border-4 ${tier.borderColor} shadow-xl ${tier.glowColor}`}
                            initial={{ rotate: -10, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                        >
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center text-4xl">
                                    🎁
                                </div>
                            )}
                            {/* Glow ring animation */}
                            <motion.div
                                className={`absolute inset-0 rounded-full border-4 ${tier.borderColor}`}
                                animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>

                        {/* Product Info */}
                        <motion.div
                            className="mt-5 text-center space-y-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
                            <Badge className={`${tier.color} text-white text-sm px-3 py-1`}>
                                ฿{product.price.toLocaleString()}
                            </Badge>
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            className="flex gap-3 mt-6 w-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 rounded-xl"
                                onClick={onClose}
                            >
                                ปิด
                            </Button>
                            <Button
                                className="flex-1 gap-2 rounded-xl"
                                onClick={onSpinAgain}
                            >
                                <RotateCcw className="h-4 w-4" />
                                สุ่มอีกครั้ง
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
