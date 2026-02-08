"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Gem, Save } from "lucide-react";
import { showSuccess, showError } from "@/lib/swal";

interface CurrencySettings {
    id: string;
    name: string;
    symbol: string;
    code: string;
    description: string | null;
    isActive: boolean;
}

const SYMBOL_OPTIONS = ["💎", "🪙", "⭐", "💰", "🎮", "🔮", "⚡", "🏆"];

export default function CurrencySettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<CurrencySettings>({
        id: "default",
        name: "พอยท์",
        symbol: "💎",
        code: "POINT",
        description: null,
        isActive: true,
    });

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/currency-settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            showError("ไม่สามารถโหลดการตั้งค่าได้");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings.name.trim() || !settings.symbol.trim()) {
            showError("กรุณากรอกชื่อและสัญลักษณ์");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/admin/currency-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                showSuccess("บันทึกการตั้งค่าเรียบร้อย 🎉");
            } else {
                showError("ไม่สามารถบันทึกได้");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            showError("เกิดข้อผิดพลาด");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Gem className="h-6 w-6 text-purple-600" />
                    ตั้งค่าสกุลเงินพิเศษ
                </h1>
                <p className="text-muted-foreground">
                    กำหนดชื่อ สัญลักษณ์ และการตั้งค่าสกุลเงิน POINT
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>การตั้งค่าทั่วไป</CardTitle>
                    <CardDescription>
                        ปรับแต่งชื่อและสัญลักษณ์ที่แสดงในเว็บไซต์
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">ชื่อสกุลเงิน *</Label>
                        <Input
                            id="name"
                            value={settings.name}
                            onChange={(e) =>
                                setSettings({ ...settings, name: e.target.value })
                            }
                            placeholder="เช่น พอยท์, เพชร, เหรียญ"
                        />
                        <p className="text-xs text-muted-foreground">
                            ชื่อนี้จะแสดงในหน้าสินค้าและ checkout
                        </p>
                    </div>

                    {/* Symbol */}
                    <div className="space-y-2">
                        <Label>สัญลักษณ์ *</Label>
                        <div className="flex flex-wrap gap-2">
                            {SYMBOL_OPTIONS.map((symbol) => (
                                <Button
                                    key={symbol}
                                    type="button"
                                    variant={settings.symbol === symbol ? "default" : "outline"}
                                    size="lg"
                                    className="text-2xl h-12 w-12"
                                    onClick={() => setSettings({ ...settings, symbol })}
                                >
                                    {symbol}
                                </Button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Label htmlFor="custom-symbol" className="text-sm">หรือใส่เอง:</Label>
                            <Input
                                id="custom-symbol"
                                value={settings.symbol}
                                onChange={(e) =>
                                    setSettings({ ...settings, symbol: e.target.value })
                                }
                                className="w-20 text-center text-xl"
                                maxLength={2}
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <Label className="text-sm text-muted-foreground">ตัวอย่างการแสดงผล</Label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="bg-background rounded-lg px-4 py-2 border">
                                <span className="text-lg font-semibold">
                                    {settings.symbol} 500 {settings.name}
                                </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                → ราคาสินค้า
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">คำอธิบาย (ไม่บังคับ)</Label>
                        <Textarea
                            id="description"
                            value={settings.description || ""}
                            onChange={(e) =>
                                setSettings({ ...settings, description: e.target.value })
                            }
                            placeholder="อธิบายวิธีการได้รับหรือใช้สกุลเงินนี้..."
                            rows={3}
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label>เปิดใช้งานระบบ</Label>
                            <p className="text-sm text-muted-foreground">
                                เมื่อปิด ระบบจะไม่แสดงตัวเลือกสกุลเงินนี้
                            </p>
                        </div>
                        <Switch
                            checked={settings.isActive}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, isActive: checked })
                            }
                        />
                    </div>

                    {/* Save Button */}
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full"
                        size="lg"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                บันทึกการตั้งค่า
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
