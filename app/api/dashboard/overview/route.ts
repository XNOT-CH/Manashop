import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "กรุณาเข้าสู่ระบบก่อน" },
                { status: 401 }
            );
        }

        const user = await db.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "ไม่พบผู้ใช้งาน" },
                { status: 404 }
            );
        }

        // Parse date param (default = today)
        const dateParam = request.nextUrl.searchParams.get("date");
        const targetDate = dateParam ? new Date(dateParam) : new Date();
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Count purchases on the selected date
        const purchasesOnDate = await db.order.count({
            where: {
                userId: user.id,
                purchasedAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
        });

        // Total spending on the selected date
        const spendingAgg = await db.order.aggregate({
            where: {
                userId: user.id,
                purchasedAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            _sum: { totalPrice: true },
        });

        // Total topup on the selected date (APPROVED)
        const topupAgg = await db.topup.aggregate({
            where: {
                userId: user.id,
                status: "APPROVED",
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            _sum: { amount: true },
        });

        return NextResponse.json({
            success: true,
            data: {
                creditBalance: Number(user.creditBalance),
                purchasesOnDate,
                totalSpending: Number(spendingAgg._sum.totalPrice || 0),
                totalTopup: Number(topupAgg._sum.amount || 0),
                date: dayStart.toISOString(),
            },
        });
    } catch (error) {
        console.error("Overview API error:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}
