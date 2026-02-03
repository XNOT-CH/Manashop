import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PurchasedItem } from "@/components/PurchasedItem";
import { Package, ShoppingBag } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
    // Get user from session
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        redirect("/login");
    }

    const user = await db.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        return (
            <div className="text-center py-20">
                <p className="text-zinc-600">ไม่พบบัญชีผู้ใช้</p>
            </div>
        );
    }

    // Fetch orders with products and product codes
    const orders = await db.order.findMany({
        where: { userId: user.id },
        include: {
            product: true,
            productCode: true,  // รวม ProductCode ที่ได้รับ
        },
        orderBy: { purchasedAt: "desc" },
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
                    <Package className="h-8 w-8 text-indigo-600" />
                    My Inventory
                </h1>
                <p className="text-zinc-500 mt-1">
                    รายการสินค้าที่คุณซื้อไปแล้ว ({orders.length} items)
                </p>
            </div>

            {orders.length === 0 ? (
                /* Empty State */
                <Card className="py-12">
                    <CardContent className="text-center">
                        <ShoppingBag className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-700 mb-2">
                            ยังไม่มีสินค้าในคลัง
                        </h3>
                        <p className="text-zinc-500 mb-4">
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
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                                    secretData={order.productCode?.code || order.product.secretData}
                                />
                            )
                    )}
                </div>
            )}
        </div>
    );
}
