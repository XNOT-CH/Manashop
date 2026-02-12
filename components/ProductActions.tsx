"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Plus, Check, MessageCircle } from "lucide-react";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart } from "@/components/providers/CartContext";
import Swal from "@/lib/swal";

interface ProductActionsProps {
    product: {
        id: string;
        name: string;
        price: number;
        discountPrice?: number | null;
        imageUrl: string | null;
        category: string;
    };
    disabled?: boolean;
    maxQuantity?: number;
}

export function ProductActions({ product, disabled = false, maxQuantity = 99 }: ProductActionsProps) {
    const router = useRouter();
    const { addToCart, isInCart, isLoading: cartLoading } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [isBuying, setIsBuying] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const inCart = isInCart(product.id);

    const totalPrice = product.price * quantity;

    // Buy Now handler
    const handlePurchase = async () => {
        if (disabled || isBuying) return;

        const confirmResult = await Swal.fire({
            title: "ยืนยันการซื้อ?",
            html: `คุณต้องการซื้อสินค้านี้ <strong>${quantity} ชิ้น</strong> ในราคา <strong>฿${totalPrice.toLocaleString()}</strong> ใช่หรือไม่?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3b82f6",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ซื้อเลย",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        });

        if (!confirmResult.isConfirmed) return;

        setIsBuying(true);

        try {
            const response = await fetch("/api/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id, quantity }),
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
            setIsBuying(false);
        }
    };

    // Add to Cart handler
    const handleAddToCart = async () => {
        if (disabled || inCart || isAdding) return;

        setIsAdding(true);
        try {
            await addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                discountPrice: product.discountPrice,
                imageUrl: product.imageUrl,
                category: product.category,
                quantity: quantity,
            });
        } finally {
            setIsAdding(false);
        }
    };

    const isProcessing = isBuying || isAdding || cartLoading;

    return (
        <div className="space-y-3">
            {/* 1. Quantity Selector */}
            {!disabled && (
                <div className="flex justify-center">
                    <QuantitySelector
                        value={quantity}
                        onChange={setQuantity}
                        min={1}
                        max={maxQuantity}
                        size="md"
                        disabled={isProcessing}
                        label="จำนวนสินค้า"
                    />
                </div>
            )}

            {/* 2. Buy Now */}
            <Button
                size="lg"
                className="w-full gap-2 text-lg rounded-xl"
                disabled={disabled || isBuying}
                onClick={handlePurchase}
            >
                {isBuying ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        กำลังดำเนินการ...
                    </>
                ) : (
                    <>
                        <ShoppingCart className="h-5 w-5" />
                        {disabled ? "ไม่พร้อมขาย" : `ซื้อเลย - ฿${totalPrice.toLocaleString()}`}
                    </>
                )}
            </Button>

            {/* 3. Add to Cart */}
            <Button
                variant={inCart ? "secondary" : "outline"}
                size="lg"
                className="w-full gap-2 text-lg rounded-xl"
                disabled={disabled || isAdding || cartLoading}
                onClick={handleAddToCart}
            >
                {isAdding ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        กำลังเพิ่ม...
                    </>
                ) : inCart ? (
                    <>
                        <Check className="h-5 w-5" />
                        อยู่ในตะกร้าแล้ว
                    </>
                ) : (
                    <>
                        <Plus className="h-5 w-5" />
                        เพิ่มลงตะกร้า
                    </>
                )}
            </Button>

            {/* 4. Contact Us */}
            <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 rounded-xl"
            >
                <MessageCircle className="h-5 w-5" />
                ติดต่อเรา
            </Button>
        </div>
    );
}
