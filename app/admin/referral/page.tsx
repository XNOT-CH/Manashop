"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Gift, Save, UserPlus, Sparkles, Shield } from "lucide-react";
import { toast } from "sonner";

interface ReferralSettings {
    REFERRAL_REWARD_INVITER: number;
    REFERRAL_REWARD_INVITEE: number;
    REFERRAL_IS_ACTIVE: boolean;
    REFERRAL_MAX_COUNT: number;
}

export default function ReferralSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<ReferralSettings>({
        REFERRAL_REWARD_INVITER: 50,
        REFERRAL_REWARD_INVITEE: 25,
        REFERRAL_IS_ACTIVE: true,
        REFERRAL_MAX_COUNT: 10,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/referral-settings");
            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    setSettings(json.data);
                }
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("ไม่สามารถโหลดการตั้งค่าได้");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/referral-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            const json = await res.json();
            if (json.success) {
                toast.success("บันทึกการตั้งค่าเรียบร้อย 🎉");
            } else {
                toast.error(json.message || "ไม่สามารถบันทึกได้");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("เกิดข้อผิดพลาด");
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
                    <Users className="h-6 w-6 text-blue-600" />
                    ระบบเชิญเพื่อน (Referral)
                </h1>
                <p className="text-muted-foreground">
                    ตั้งค่าระบบเชิญเพื่อนและรางวัลพอยท์
                </p>
            </div>

            {/* Settings Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-purple-600" />
                        การตั้งค่ารางวัล
                    </CardTitle>
                    <CardDescription>
                        กำหนดจำนวนพอยท์ที่ได้รับเมื่อเชิญเพื่อนสำเร็จ
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Inviter Reward */}
                    <div className="space-y-2">
                        <Label htmlFor="inviter-reward" className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-green-600" />
                            พอยท์สำหรับผู้เชิญ
                        </Label>
                        <Input
                            id="inviter-reward"
                            type="number"
                            min={0}
                            value={settings.REFERRAL_REWARD_INVITER}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    REFERRAL_REWARD_INVITER: parseInt(e.target.value, 10) || 0,
                                })
                            }
                            placeholder="50"
                        />
                        <p className="text-xs text-muted-foreground">
                            จำนวนพอยท์ที่ผู้เชิญจะได้รับเมื่อเพื่อนสมัครสมาชิกสำเร็จ
                        </p>
                    </div>

                    {/* Invitee Reward */}
                    <div className="space-y-2">
                        <Label htmlFor="invitee-reward" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-600" />
                            พอยท์สำหรับผู้ถูกเชิญ
                        </Label>
                        <Input
                            id="invitee-reward"
                            type="number"
                            min={0}
                            value={settings.REFERRAL_REWARD_INVITEE}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    REFERRAL_REWARD_INVITEE: parseInt(e.target.value, 10) || 0,
                                })
                            }
                            placeholder="25"
                        />
                        <p className="text-xs text-muted-foreground">
                            จำนวนพอยท์ที่สมาชิกใหม่จะได้รับเมื่อสมัครด้วยลิงก์เชิญ
                        </p>
                    </div>

                    {/* Max Referral Count */}
                    <div className="space-y-2">
                        <Label htmlFor="max-count" className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            จำนวนเชิญสูงสุด (ป้องกันการปั้ม)
                        </Label>
                        <Input
                            id="max-count"
                            type="number"
                            min={0}
                            value={settings.REFERRAL_MAX_COUNT}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    REFERRAL_MAX_COUNT: parseInt(e.target.value, 10) || 0,
                                })
                            }
                            placeholder="10"
                        />
                        <p className="text-xs text-muted-foreground">
                            จำกัดจำนวนคนที่แต่ละผู้ใช้สามารถเชิญได้ (0 = ไม่จำกัด)
                        </p>
                    </div>

                    {/* Preview Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
                        <Label className="text-sm text-muted-foreground">ตัวอย่างการแสดงผล</Label>
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-green-600">👤 ผู้เชิญได้รับ:</span>
                                <span className="font-bold text-green-700">
                                    +{settings.REFERRAL_REWARD_INVITER} พอยท์
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-amber-600">✨ สมาชิกใหม่ได้รับ:</span>
                                <span className="font-bold text-amber-700">
                                    +{settings.REFERRAL_REWARD_INVITEE} พอยท์
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-blue-600">🛡️ เชิญได้สูงสุด:</span>
                                <span className="font-bold text-blue-700">
                                    {settings.REFERRAL_MAX_COUNT === 0 ? "ไม่จำกัด" : `${settings.REFERRAL_MAX_COUNT} คน`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label>เปิดใช้งานระบบเชิญเพื่อน</Label>
                            <p className="text-sm text-muted-foreground">
                                เมื่อปิด ระบบจะไม่ให้รางวัลพอยท์เมื่อใช้ลิงก์เชิญ
                            </p>
                        </div>
                        <Switch
                            checked={settings.REFERRAL_IS_ACTIVE}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, REFERRAL_IS_ACTIVE: checked })
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
