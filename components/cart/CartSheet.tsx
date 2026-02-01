"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Loader2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/CartContext";
import { CartItem } from "./CartItem";
import { CartIcon } from "./CartIcon";
import { toast } from "sonner";

export function CartSheet() {
    const router = useRouter();
    const { items, removeFromCart, clearCart, total, itemCount, isLoading } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleCheckout = async () => {
        if (items.length === 0) {
            toast.error("ตะกร้าว่างเปล่า");
            return;
        }

        setIsCheckingOut(true);
        try {
            const response = await fetch("/api/cart/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productIds: items.map((item) => item.id),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("ซื้อสำเร็จ! 🎉", {
                    description: `ซื้อ ${data.purchasedCount} รายการ รวม ฿${data.totalPrice.toLocaleString()}`,
                });
                clearCart();
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error("ไม่สามารถซื้อได้", {
                    description: data.message,
                });
                // If some items were sold, remove them from cart
                if (data.soldProductIds && Array.isArray(data.soldProductIds)) {
                    data.soldProductIds.forEach((id: string) => removeFromCart(id));
                }
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error("เกิดข้อผิดพลาด", {
                description: "กรุณาลองใหม่อีกครั้ง",
            });
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <div>
                    <CartIcon onClick={() => setIsOpen(true)} />
                </div>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader className="space-y-1">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        ตะกร้าสินค้า
                        {itemCount > 0 && (
                            <span className="text-sm font-normal text-muted-foreground">
                                ({itemCount} รายการ)
                            </span>
                        )}
                    </SheetTitle>
                    <SheetDescription>
                        รายการสินค้าที่คุณเลือกไว้
                    </SheetDescription>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="font-medium text-lg text-foreground">ตะกร้าว่างเปล่า</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            เพิ่มสินค้าที่คุณสนใจลงตะกร้าเลย!
                        </p>
                        <Button
                            variant="outline"
                            className="mt-6"
                            onClick={() => setIsOpen(false)}
                        >
                            เลือกซื้อสินค้า
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Cart Items */}
                        <ScrollArea className="flex-1 -mx-6 px-6">
                            <div className="py-4">
                                {items.map((item) => (
                                    <CartItem
                                        key={item.id}
                                        item={item}
                                        onRemove={removeFromCart}
                                    />
                                ))}
                            </div>
                        </ScrollArea>

                        <Separator />

                        {/* Cart Summary */}
                        <div className="py-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">รวมสินค้า ({itemCount} รายการ)</span>
                                <span className="font-medium">฿{total.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-lg font-bold">
                                <span>ยอดรวมทั้งหมด</span>
                                <span className="text-primary">฿{total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <SheetFooter className="flex-col gap-2 sm:flex-col">
                            <Button
                                className="w-full gap-2"
                                size="lg"
                                onClick={handleCheckout}
                                disabled={isCheckingOut || isLoading}
                            >
                                {isCheckingOut ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        กำลังดำเนินการ...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="h-4 w-4" />
                                        ชำระเงิน ฿{total.toLocaleString()}
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full gap-2"
                                onClick={clearCart}
                                disabled={isCheckingOut}
                            >
                                <Trash2 className="h-4 w-4" />
                                ล้างตะกร้า
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
