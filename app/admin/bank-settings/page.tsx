"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Building2,
    CreditCard,
    User,
    Loader2,
    Save,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BankSettings {
    bankName: string;
    accountName: string;
    accountNumber: string;
    isActive: boolean;
}

export default function AdminBankSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<BankSettings>({
        bankName: "",
        accountName: "",
        accountNumber: "",
        isActive: true,
    });

    // Fetch settings on mount
    useEffect(() => {
        async function fetchSettings() {
            try {
                const res = await fetch("/api/admin/settings/bank");
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setSettings(data.settings);
                    }
                }
            } catch (error) {
                console.error("Error fetching bank settings:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch("/api/admin/settings/bank", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("บันทึกการตั้งค่าสำเร็จ");
            } else {
                toast.error(data.message || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("ไม่สามารถบันทึกการตั้งค่าได้");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
                    ตั้งค่าบัญชีธนาคาร <span className="text-3xl">🏦</span>
                </h1>
                <p className="text-zinc-500 mt-1">
                    แก้ไขข้อมูลบัญชีธนาคารสำหรับรับเงินเติมเครดิต
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            ข้อมูลบัญชีธนาคาร
                        </CardTitle>
                        <CardDescription>
                            ข้อมูลเหล่านี้จะแสดงในหน้าเติมเงินของผู้ใช้
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Bank Name */}
                        <div className="space-y-2">
                            <Label htmlFor="bankName" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                ชื่อธนาคาร
                            </Label>
                            <Input
                                id="bankName"
                                placeholder="เช่น ธนาคารกสิกรไทย"
                                value={settings.bankName}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        bankName: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        {/* Account Name */}
                        <div className="space-y-2">
                            <Label htmlFor="accountName" className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                ชื่อบัญชี
                            </Label>
                            <Input
                                id="accountName"
                                placeholder="เช่น บจก. บริษัทของคุณ"
                                value={settings.accountName}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        accountName: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        {/* Account Number */}
                        <div className="space-y-2">
                            <Label htmlFor="accountNumber" className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-primary" />
                                เลขบัญชี
                            </Label>
                            <Input
                                id="accountNumber"
                                placeholder="เช่น 123-4-56789-0"
                                value={settings.accountNumber}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        accountNumber: e.target.value,
                                    }))
                                }
                            />
                            <p className="text-xs text-zinc-400">
                                สามารถใส่ขีดคั่นได้เพื่อให้อ่านง่าย
                            </p>
                        </div>

                        {/* Status Toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={settings.isActive}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        isActive: e.target.checked,
                                    }))
                                }
                                className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isActive" className="font-normal">
                                เปิดรับเงินโอน
                            </Label>
                        </div>

                        {/* Preview */}
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700">
                                <div className="font-medium mb-2">ตัวอย่างที่จะแสดงในหน้าเติมเงิน:</div>
                                <div className="bg-white rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">ธนาคาร:</span>
                                        <span className="font-semibold">{settings.bankName || "-"}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">ชื่อบัญชี:</span>
                                        <span className="font-semibold">{settings.accountName || "-"}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">เลขบัญชี:</span>
                                        <span className="font-semibold">{settings.accountNumber || "-"}</span>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>

                        {!settings.isActive && (
                            <Alert className="bg-amber-50 border-amber-200">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-700">
                                    ระบบเติมเงินถูกปิดอยู่ ผู้ใช้จะไม่สามารถเติมเงินได้
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                size="lg"
                                className="gap-2"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        บันทึกการตั้งค่า
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
