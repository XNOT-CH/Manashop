"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { CartItem as CartItemType } from "@/components/providers/CartContext";

interface CartItemProps {
    item: CartItemType;
    onRemove: (id: string) => void;
}

export function CartItem({ item, onRemove }: CartItemProps) {
    const displayPrice = item.discountPrice ?? item.price;
    const hasDiscount = item.discountPrice !== null && item.discountPrice !== undefined && item.discountPrice < item.price;

    return (
        <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
            {/* Product Image */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                    src={item.imageUrl || "/placeholder.jpg"}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/64x64/f1f5f9/64748b?text=No+Image";
                    }}
                />
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate text-foreground">
                    {item.name}
                </h4>
                <p className="text-xs text-muted-foreground">{item.category}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-primary">
                        ฿{displayPrice.toLocaleString()}
                    </span>
                    {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">
                            ฿{item.price.toLocaleString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Remove Button */}
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                onClick={() => onRemove(item.id)}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
