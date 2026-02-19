import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import {
    DollarSign,
    Users,
    UserCheck,
    ShoppingCart,
} from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { SalesDistribution } from "@/components/admin/SalesDistribution";
import { RecentTransactions } from "@/components/admin/RecentTransactions";
import { TopupSummaryWithDateRange } from "@/components/TopupSummaryWithDateRange";
import { MembersSummary } from "@/components/MembersSummary";
import { DashboardTabs } from "@/components/DashboardTabs";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    // Fetch real stats from database
    const [ordersData, productsCount, usersCount] = await Promise.all([
        db.order.aggregate({
            _sum: { totalPrice: true },
            _count: true,
        }),
        db.product.count(),
        db.user.count(),
    ]);

    const totalRevenue = Number(ordersData._sum.totalPrice || 0);
    const salesCount = ordersData._count;

    // KPI cards data with icons, values, and mock percentage changes
    const kpiCards = [
        {
            title: "รายได้ทั้งหมด",
            value: `฿${totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
            iconColor: "text-sky-600 dark:text-sky-400",
        },
        {
            title: "ผู้ใช้งานทั้งหมด",
            value: usersCount.toLocaleString(),
            icon: Users,
            iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
            iconColor: "text-sky-600 dark:text-sky-400",
        },
        {
            title: "ผู้ใช้งานวันนี้",
            value: Math.floor(usersCount * 0.3).toLocaleString(),
            icon: UserCheck,
            iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
            iconColor: "text-sky-600 dark:text-sky-400",
        },
        {
            title: "คำสั่งซื้อทั้งหมด",
            value: salesCount.toLocaleString(),
            icon: ShoppingCart,
            iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
            iconColor: "text-sky-600 dark:text-sky-400",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header with Date Picker */}
            <AdminDashboardHeader />

            {/* Tabbed Content */}
            <DashboardTabs
                overviewContent={
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {kpiCards.map((kpi) => {
                                const Icon = kpi.icon;

                                return (
                                    <Card
                                        key={kpi.title}
                                        className="relative overflow-hidden border-border/50 hover:shadow-lg transition-shadow duration-300"
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        {kpi.title}
                                                    </p>
                                                    <p className="text-3xl font-bold tracking-tight">
                                                        {kpi.value}
                                                    </p>
                                                </div>
                                                <div
                                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${kpi.iconBg}`}
                                                >
                                                    <Icon
                                                        className={`h-6 w-6 ${kpi.iconColor}`}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>

                                        {/* Decorative gradient bar at top */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-400" />
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Revenue Trend Chart */}
                        <Card className="border-border/50">
                            <CardContent className="p-6">
                                <RevenueChart />
                            </CardContent>
                        </Card>
                    </div>
                }
                topupContent={
                    <TopupSummaryWithDateRange />
                }
                membersContent={
                    <MembersSummary />
                }
                purchasesContent={
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
                        {/* Sales Distribution — 2 columns */}
                        <Card className="lg:col-span-2 border-border/50">
                            <CardContent className="p-6">
                                <SalesDistribution />
                            </CardContent>
                        </Card>

                        {/* Recent Transactions — 3 columns */}
                        <Card className="lg:col-span-3 border-border/50">
                            <CardContent className="p-6">
                                <RecentTransactions />
                            </CardContent>
                        </Card>
                    </div>
                }
            />
        </div>
    );
}

