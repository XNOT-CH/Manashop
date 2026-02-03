"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

interface BuyButtonProps {
    productId: string;
    price: number;
    disabled?: boolean;
}

export function BuyButton({ productId, price, disabled }: BuyButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handlePurchase = async () => {
        if (disabled || isLoading) return;

        // Confirm before purchase
        const confirmResult = await Swal.fire({
            title: "ยืนยันการสั่งซื้อ?",
            html: `<p style="color: #6b7280;">คุณต้องการซื้อสินค้านี้ในราคา <strong style="color: #3b82f6;">฿${price.toLocaleString()}</strong> ใช่หรือไม่?</p>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "ยืนยัน",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        });

        if (!confirmResult.isConfirmed) return;

        setIsLoading(true);

        try {
            const response = await fetch("/api/purchase", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ productId }),
            });

            const data = await response.json();

            if (data.success) {
                await Swal.fire({
                    icon: "success",
                    title: "ซื้อสำเร็จ! 🎉",
                    html: `ซื้อ <strong>${data.productName}</strong> เรียบร้อยแล้ว<br><small>ดูข้อมูลบัญชีได้ที่ประวัติการสั่งซื้อ</small>`,
                    confirmButtonColor: "#3b82f6",
                    confirmButtonText: "ตกลง",
                });
                router.refresh();
            } else {
                await Swal.fire({
                    icon: "warning",
                    title: "ไม่สามารถซื้อได้",
                    text: data.message,
                    confirmButtonColor: "#3b82f6",
                    confirmButtonText: "ตกลง",
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
                confirmButtonColor: "#3b82f6",
                confirmButtonText: "ตกลง",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            size="lg"
            className="mt-auto w-full gap-2 text-lg"
            disabled={disabled || isLoading}
            onClick={handlePurchase}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    กำลังดำเนินการ...
                </>
            ) : (
                <>
                    <ShoppingCart className="h-5 w-5" />
                    {disabled ? "ไม่พร้อมขาย" : `ซื้อเลย - ฿${price.toLocaleString()}`}
                </>
            )}
        </Button>
    );
}
