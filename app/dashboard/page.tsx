import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PurchasedItem } from "@/components/PurchasedItem";
import { ReferralCard } from "@/components/ReferralCard";
import {
    Wallet,
    Package,
    ShoppingBag,
    ArrowRight,
    Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

    const orders = await db.order.findMany({
        where: { userId: user.id },
        include: { product: true },
        orderBy: { purchasedAt: "desc" },
        take: 6,
    });

    const creditBalance = Number(user.creditBalance);
    const totalPurchased = orders.length;

    // Get referral count (will work after Prisma migration)
    const referralCount = 0; // Placeholder until schema is synced
    const referralCode = (user as { referralCode?: string }).referralCode || "";

    return (
        <div className="space-y-8 animate-page-enter">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    สวัสดี, {user.username}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                    ยินดีต้อนรับกลับมา นี่คือภาพรวมบัญชีของคุณ
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Credit Balance */}
                <Card className="bg-primary text-primary-foreground overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">
                            ยอดเครดิต
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <span className="text-4xl font-bold">
                                ฿{creditBalance.toLocaleString()}
                            </span>
                            <Wallet className="h-8 w-8 opacity-50" />
                        </div>
                        <Link href="/dashboard/topup">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="mt-4 gap-1 w-full"
                            >
                                <Zap className="h-4 w-4" />
                                เติมเงิน
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Total Purchased */}
                <Card className="bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            สินค้าที่ซื้อ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <span className="text-4xl font-bold text-foreground">
                                {totalPurchased}
                            </span>
                            <Package className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            รายการในคลังของคุณ
                        </p>
                    </CardContent>
                </Card>

                {/* Quick Action */}
                <Card className="bg-card border-dashed">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            ซื้อสินค้าเพิ่ม
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            ค้นหาไอดีเกมที่คุณต้องการ
                        </p>
                        <Link href="/shop">
                            <Button variant="outline" className="w-full gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                ไปร้านค้า
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Referral Card */}
                {referralCode && (
                    <ReferralCard
                        referralCode={referralCode}
                        referralCount={referralCount}
                    />
                )}
            </div>

            <Separator />

            {/* Recent Purchases */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            สินค้าที่ซื้อล่าสุด
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            ดูข้อมูลสินค้าของคุณได้ที่นี่
                        </p>
                    </div>
                    {orders.length > 0 && (
                        <Link href="/dashboard/inventory">
                            <Button variant="outline" size="sm" className="gap-1">
                                ดูทั้งหมด
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>

                {orders.length === 0 ? (
                    <Card className="py-12 bg-card">
                        <CardContent className="text-center">
                            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                ยังไม่มีสินค้า
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                คุณยังไม่ได้ซื้อสินค้าใดๆ
                            </p>
                            <Link href="/shop">
                                <Button>
                                    <ShoppingBag className="h-4 w-4 mr-2" />
                                    เริ่มช้อปปิ้ง
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {orders.map((order) => (
                            order.product && (
                                <PurchasedItem
                                    key={order.id}
                                    title={order.product.name}
                                    image={order.product.imageUrl || "/placeholder.jpg"}
                                    date={new Date(order.purchasedAt).toLocaleDateString("th-TH", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                    secretData={order.product.secretData}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
