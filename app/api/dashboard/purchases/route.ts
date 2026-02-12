import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

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
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        const orders = await db.order.findMany({
            where: {
                userId,
                purchasedAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            include: { product: true },
            orderBy: { purchasedAt: "desc" },
            take: 20,
        });

        const items = orders
            .filter((o) => o.product)
            .map((order) => ({
                id: order.id,
                title: order.product!.name,
                image: order.product!.imageUrl || "/placeholder.jpg",
                date: new Date(order.purchasedAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                }),
                price: Number(order.totalPrice),
                secretData: order.givenData ? decrypt(order.givenData) : "ไม่พบข้อมูล",
            }));

        return NextResponse.json({
            success: true,
            data: items,
        });
    } catch (error) {
        console.error("Purchases API error:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}
