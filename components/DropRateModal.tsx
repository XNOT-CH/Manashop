"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DropRateModalProps {
    open: boolean;
    onClose: () => void;
}

const TIERS = [
    { label: "Legendary", labelTh: "ระดับตำนาน", rate: 1, dotCls: "bg-red-500", barCls: "bg-red-500", textCls: "text-red-500" },
    { label: "Epic", labelTh: "หายากมาก", rate: 15, dotCls: "bg-violet-500", barCls: "bg-violet-500", textCls: "text-violet-500" },
    { label: "Rare", labelTh: "หายาก", rate: 30, dotCls: "bg-emerald-400", barCls: "bg-emerald-400", textCls: "text-emerald-500" },
    { label: "Common", labelTh: "ทั่วไป", rate: 50, dotCls: "bg-amber-400", barCls: "bg-amber-400", textCls: "text-amber-500" },
] as const;

export function DropRateModal({ open, onClose }: DropRateModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="relative z-10 w-full max-w-xs bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0, y: -10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -10 }}
                        transition={{ type: "spring", stiffness: 340, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <p className="font-semibold text-sm text-foreground">อัตราการดรอป</p>
                            <button onClick={onClose}
                                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Tier rows */}
                        <div className="px-4 py-3 flex flex-col divide-y divide-border/50">
                            {TIERS.map((tier, i) => (
                                <div key={tier.label} className="flex items-center gap-3 py-2.5">
                                    {/* dot */}
                                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tier.dotCls}`} />

                                    {/* label */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground leading-none">{tier.label}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">{tier.labelTh}</p>
                                    </div>

                                    {/* rate + bar */}
                                    <div className="flex flex-col items-end gap-1 w-20 flex-shrink-0">
                                        <span className={`text-sm font-bold ${tier.textCls}`}>{tier.rate}%</span>
                                        <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full ${tier.barCls}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${tier.rate}%` }}
                                                transition={{ delay: 0.1 + i * 0.06, duration: 0.45, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <p className="text-[10px] text-muted-foreground text-center px-4 pb-3">
                            * ข้อมูลนี้เป็นการประมาณการเท่านั้น *
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
