import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { DashboardClient } from "@/components/DashboardClient";

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

    return (
        <div className="space-y-6 animate-page-enter">
            {/* Breadcrumb */}
            <PageBreadcrumb items={[{ label: "แดชบอร์ด" }]} />
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    สวัสดี, {user.username}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                    ยินดีต้อนรับกลับมา นี่คือภาพรวมบัญชีของคุณ
                </p>
            </div>

            {/* Dashboard Tabs with Date Filters */}
            <DashboardClient
                username={user.username}
                initialCreditBalance={Number(user.creditBalance)}
            />
        </div>
    );
}
