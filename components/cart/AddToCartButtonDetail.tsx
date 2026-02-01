"use client";

import { Button } from "@/components/ui/button";
import { Plus, Check, Loader2 } from "lucide-react";
import { useCart, CartItem } from "@/components/providers/CartContext";
import { useState } from "react";

interface ProductDetailAddToCartProps {
    product: {
        id: string;
        name: string;
        price: number;
        discountPrice?: number | null;
        imageUrl: string | null;
        category: string;
    };
    disabled?: boolean;
}

export function ProductDetailAddToCart({ product, disabled = false }: ProductDetailAddToCartProps) {
    const { addToCart, isInCart, isLoading: cartLoading } = useCart();
    const [isAdding, setIsAdding] = useState(false);
    const inCart = isInCart(product.id);

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
            });
        } finally {
            setIsAdding(false);
        }
    };

    return (
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
    );
}
