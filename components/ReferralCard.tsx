"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Copy, Check, Gift } from "lucide-react";
import { toast } from "sonner";

interface ReferralCardProps {
    referralCode: string;
    referralCount: number;
}

export function ReferralCard({ referralCode, referralCount }: ReferralCardProps) {
    const [copied, setCopied] = useState(false);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const referralLink = `${baseUrl}/register?ref=${referralCode}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            toast.success("คัดลอกลิงก์แล้ว!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("ไม่สามารถคัดลอกได้");
        }
    };

    return (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    เชิญเพื่อนรับพอยท์
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                    แชร์ลิงก์นี้ให้เพื่อน เมื่อเพื่อนสมัคร คุณและเพื่อนจะได้รับพอยท์!
                </p>

                <div className="flex gap-2">
                    <Input
                        readOnly
                        value={referralLink}
                        className="text-xs bg-white"
                    />
                    <Button
                        size="icon"
                        variant={copied ? "default" : "outline"}
                        onClick={handleCopy}
                        className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                        {copied ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <Users className="h-3 w-3" />
                    <span>เชิญแล้ว {referralCount} คน</span>
                </div>
            </CardContent>
        </Card>
    );
}
