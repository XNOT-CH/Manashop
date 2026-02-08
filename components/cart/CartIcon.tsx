"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/providers/CartContext";

interface CartIconProps {
    onClick?: () => void;
}

export function CartIcon({ onClick }: CartIconProps) {
    const { itemCount } = useCart();

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10"
            onClick={onClick}
            aria-label={`ตะกร้าสินค้า (${itemCount} รายการ)`}
        >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
                <Badge
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground rounded-full badge-pop"
                >
                    {itemCount > 99 ? "99+" : itemCount}
                </Badge>
            )}
        </Button>
    );
}
