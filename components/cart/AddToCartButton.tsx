"use client";

import { Button } from "@/components/ui/button";
import { Plus, Check, Loader2 } from "lucide-react";
import { useCart, CartItem } from "@/components/providers/CartContext";
import { useState } from "react";

interface AddToCartButtonProps {
    product: CartItem;
    disabled?: boolean;
    size?: "sm" | "default" | "lg" | "icon";
    className?: string;
    showText?: boolean;
}

export function AddToCartButton({
    product,
    disabled = false,
    size = "sm",
    className = "",
    showText = true,
}: AddToCartButtonProps) {
    const { addToCart, isInCart, isLoading: cartLoading } = useCart();
    const [isAdding, setIsAdding] = useState(false);
    const inCart = isInCart(product.id);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (disabled || inCart || isAdding) return;

        setIsAdding(true);
        try {
            await addToCart(product);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Button
            variant={inCart ? "secondary" : "outline"}
            size={size}
            className={`gap-2 rounded-xl transition-all duration-200 ${className}`}
            disabled={disabled || isAdding || cartLoading}
            onClick={handleAddToCart}
        >
            {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : inCart ? (
                <Check className="h-4 w-4" />
            ) : (
                <Plus className="h-4 w-4" />
            )}
            {showText && (inCart ? "อยู่ในตะกร้า" : "ตะกร้า")}
        </Button>
    );
}
