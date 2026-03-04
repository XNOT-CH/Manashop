"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Plus, Check, MessageCircle } from "lucide-react";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart } from "@/components/providers/CartContext";
import { showPurchaseConfirm, showPurchaseSuccessModal, showWarning, showErrorAlert } from "@/lib/swal";

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

        const confirmed = await showPurchaseConfirm({
            productName: product.name,
            priceText: `฿${totalPrice.toLocaleString()}`,
            extraHtml: `<small>จำนวน: <strong>${quantity}</strong> ชิ้น</small>`,
        });

        if (!confirmed) return;

        setIsBuying(true);

        try {
            const response = await fetch("/api/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id, quantity }),
            });

            const data = await response.json();

            if (data.success) {
                await showPurchaseSuccessModal({
                    productName: data.productName,
                });
                router.refresh();
            } else {
                showWarning(data.message);
            }
        } catch (error) {
            await showErrorAlert(
                "เกิดข้อผิดพลาด",
                error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง"
            );
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
                className={`w-full gap-2 text-base rounded-full font-semibold ${disabled
                        ? "bg-rose-100 text-rose-400 hover:bg-rose-100 cursor-not-allowed border border-rose-200"
                        : "bg-violet-600 hover:bg-violet-700 text-white"
                    }`}
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
                        {disabled ? "สินค้าหมด 🚫" : `ซื้อเลย - ฿${totalPrice.toLocaleString()}`}
                    </>
                )}
            </Button>

            {/* 3. Add to Cart */}
            <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 text-base rounded-full border-border hover:bg-muted"
                disabled={disabled || isAdding || cartLoading}
                onClick={handleAddToCart}
            >
                {isAdding ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        กำลังเพิ่ม...
                    </>
                ) : inCart ? (
                    <>
                        <Check className="h-4 w-4" />
                        อยู่ในตะกร้าแล้ว
                    </>
                ) : (
                    <>
                        <Plus className="h-4 w-4" />
                        เพิ่มลงตะกร้า
                    </>
                )}
            </Button>

            {/* 4. Contact Us */}
            <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 text-base rounded-full border-border hover:bg-muted"
            >
                <MessageCircle className="h-4 w-4" />
                ติดต่อเรา
            </Button>
        </div>
    );
}
