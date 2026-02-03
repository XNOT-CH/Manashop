"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw, Settings } from "lucide-react";
import Swal from "sweetalert2";

interface TierConfig {
    tiers: {
        bronze: { min: number; max: number; name: string; color: string; icon: string };
        silver: { min: number; max: number; name: string; color: string; icon: string };
        gold: { min: number; max: number; name: string; color: string; icon: string };
        diamond: { min: number; max: number; name: string; color: string; icon: string };
        legend: { min: number; name: string; color: string; icon: string };
    };
    borders: {
        gold: number;
        platinum: number;
    };
}

const DEFAULT_CONFIG: TierConfig = {
    tiers: {
        bronze: { min: 500, max: 999, name: "Bronze", color: "#CD7F32", icon: "🥉" },
        silver: { min: 1000, max: 4999, name: "Silver", color: "#C0C0C0", icon: "🥈" },
        gold: { min: 5000, max: 49999, name: "Gold", color: "#FFD700", icon: "👑" },
        diamond: { min: 50000, max: 199999, name: "Diamond", color: "#4FC3F7", icon: "💎" },
        legend: { min: 200000, name: "Legend", color: "#9C27B0", icon: "👑" },
    },
    borders: {
        gold: 5000,
        platinum: 20000,
    },
};

export default function TierSettingsPage() {
    const [config, setConfig] = useState<TierConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await fetch("/api/admin/settings/tiers");
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (err) {
            console.error("Error fetching config:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess(false);

        try {
            const response = await fetch("/api/admin/settings/tiers", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "เกิดข้อผิดพลาด");
                return;
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        const result = await Swal.fire({
            title: "รีเซ็ตเป็นค่าเริ่มต้น?",
            text: "ข้อมูลที่แก้ไขทั้งหมดจะถูกเปลี่ยนกลับเป็นค่าเริ่มต้น",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ใช่, รีเซ็ต",
            cancelButtonText: "ยกเลิก",
        });

        if (result.isConfirmed) {
            setConfig(DEFAULT_CONFIG);
        }
    };

    const updateTier = (tier: keyof TierConfig["tiers"], field: string, value: number) => {
        setConfig((prev) => ({
            ...prev,
            tiers: {
                ...prev.tiers,
                [tier]: {
                    ...prev.tiers[tier],
                    [field]: value,
                },
            },
        }));
    };

    const updateBorder = (border: keyof TierConfig["borders"], value: number) => {
        setConfig((prev) => ({
            ...prev,
            borders: {
                ...prev.borders,
                [border]: value,
            },
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" />
                    ตั้งค่าระดับผู้ใช้ (Tier System)
                </h1>
                <p className="text-gray-600 mt-2">
                    กำหนดเกณฑ์เงินสำหรับแต่ละระดับของผู้ใช้
                </p>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    บันทึกสำเร็จ!
                </div>
            )}

            {/* Tier Configuration */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
                <h2 className="text-xl font-semibold">ระดับ VIP (ยอดเติมสะสม)</h2>

                {/* Bronze */}
                <div className="border-l-4 border-[#CD7F32] pl-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🥉</span>
                        <h3 className="text-lg font-semibold" style={{ color: "#CD7F32" }}>
                            Bronze
                        </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ขั้นต่ำ (บาท)
                            </label>
                            <input
                                type="number"
                                value={config.tiers.bronze.min}
                                onChange={(e) => updateTier("bronze", "min", Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                สูงสุด (บาท)
                            </label>
                            <input
                                type="number"
                                value={config.tiers.bronze.max}
                                onChange={(e) => updateTier("bronze", "max", Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Silver */}
                <div className="border-l-4 border-[#C0C0C0] pl-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🥈</span>
                        <h3 className="text-lg font-semibold" style={{ color: "#808080" }}>
                            Silver
                        </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ขั้นต่ำ (บาท)
                            </label>
                            <input
                                type="number"
                                value={config.tiers.silver.min}
                                onChange={(e) => updateTier("silver", "min", Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                สูงสุด (บาท)
                            </label>
                            <input
                                type="number"
                                value={config.tiers.silver.max}
                                onChange={(e) => updateTier("silver", "max", Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Gold */}
                <div className="border-l-4 border-[#FFD700] pl-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">👑</span>
                        <h3 className="text-lg font-semibold" style={{ color: "#FFD700" }}>
                            Gold / VIP
                        </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ขั้นต่ำ (บาท)
                            </label>
                            <input
                                type="number"
                                value={config.tiers.gold.min}
                                onChange={(e) => updateTier("gold", "min", Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                สูงสุด (บาท)
                            </label>
                            <input
                                type="number"
                                value={config.tiers.gold.max}
                                onChange={(e) => updateTier("gold", "max", Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Diamond */}
                <div className="border-l-4 border-[#4FC3F7] pl-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">💎</span>
                        <h3 className="text-lg font-semibold" style={{ color: "#4FC3F7" }}>
                            Diamond
                        </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ขั้นต่ำ (บาท)
                            </label>
                            <input
                                type="number"
                                value={config.tiers.diamond.min}
                                onChange={(e) => updateTier("diamond", "min", Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                สูงสุด (บาท)
                            </label>
                            <input
                                type="number"
                                value={config.tiers.diamond.max}
                                onChange={(e) => updateTier("diamond", "max", Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="border-l-4 border-[#9C27B0] pl-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">👑</span>
                        <h3 className="text-lg font-semibold" style={{ color: "#9C27B0" }}>
                            Legend (สูงสุด)
                        </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ขั้นต่ำ (บาท)
                            </label>
                            <input
                                type="number"
                                value={config.tiers.legend.min}
                                onChange={(e) => updateTier("legend", "min", Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            (ไม่มีขีดจำกัดสูงสุด)
                        </div>
                    </div>
                </div>
            </div>

            {/* Border Configuration */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
                <h2 className="text-xl font-semibold">กรอบพิเศษ (พอยต์สะสม)</h2>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            🥇 กรอบทอง (บาท)
                        </label>
                        <input
                            type="number"
                            value={config.borders.gold}
                            onChange={(e) => updateBorder("gold", Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">พอยต์สะสมที่ได้กรอบทอง</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            💠 กรอบแพลทินัม (บาท)
                        </label>
                        <input
                            type="number"
                            value={config.borders.platinum}
                            onChange={(e) => updateBorder("platinum", Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-gray-500 mt-1">พอยต์สะสมที่ได้กรอบแพลทินัม</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                    <Save className="h-5 w-5" />
                    {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                    <RotateCcw className="h-5 w-5" />
                    รีเซ็ตเป็นค่าเริ่มต้น
                </button>
            </div>
        </div>
    );
}
