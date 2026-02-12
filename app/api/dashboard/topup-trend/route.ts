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

        // Parse date param (default = today)
        const dateParam = request.nextUrl.searchParams.get("date");
        const targetDate = dateParam ? new Date(dateParam) : new Date();

        // Last 7 days range ending on target date
        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date(targetDate);
        startDate.setDate(targetDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        // Fetch APPROVED topups in the range
        const topups = await db.topup.findMany({
            where: {
                status: "APPROVED",
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                amount: true,
                createdAt: true,
            },
        });

        // Build a map for every day in the 7-day window
        const dailyMap = new Map<string, number>();
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
            dailyMap.set(key, 0);
        }

        // Aggregate amounts by date
        for (const t of topups) {
            const key = new Date(t.createdAt).toISOString().slice(0, 10);
            if (dailyMap.has(key)) {
                dailyMap.set(key, (dailyMap.get(key) || 0) + Number(t.amount));
            }
        }

        // Convert to array with Thai-formatted labels
        const data = Array.from(dailyMap.entries()).map(([dateStr, amount]) => {
            const d = new Date(dateStr);
            const label = d.toLocaleDateString("th-TH", {
                day: "2-digit",
                month: "short",
            });
            return { date: label, amount };
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Topup trend error:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}
