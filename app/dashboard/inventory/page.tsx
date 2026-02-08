import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PurchasedItem } from "@/components/PurchasedItem";
import { Package, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
    // Get logged-in user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        redirect("/login");
    }

    const user = await db.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        redirect("/login");
    }

    // Fetch orders with products
    const orders = await db.order.findMany({
        where: { userId: user.id },
        include: { product: true },
        orderBy: { purchasedAt: "desc" },
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    คลังสินค้าของฉัน
                </h1>
                <p className="text-muted-foreground mt-1">
                    รายการสินค้าที่คุณซื้อไปแล้ว ({orders.length} รายการ)
                </p>
            </div>

            {orders.length === 0 ? (
                /* Empty State */
                <Card className="py-12">
                    <CardContent className="text-center">
                        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            ยังไม่มีสินค้าในคลัง
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            คุณยังไม่ได้ซื้อสินค้าใดๆ ลองไปเลือกดูสินค้าก่อนนะ
                        </p>
                        <Link href="/shop">
                            <Button className="gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                ไปช้อปปิ้งเลย
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                /* Inventory Grid */
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {orders.map(
                        (order) =>
                            order.product && (
                                <PurchasedItem
                                    key={order.id}
                                    title={order.product.name}
                                    image={order.product.imageUrl || "/placeholder.jpg"}
                                    date={new Date(order.purchasedAt).toLocaleDateString(
                                        "th-TH",
                                        {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        }
                                    )}
                                    secretData={order.givenData ? decrypt(order.givenData) : "ไม่พบข้อมูล"}
                                />
                            )
                    )}
                </div>
            )}
        </div>
    );
}

