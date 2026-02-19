import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export async function GET() {
    const authCheck = await isAdmin();
    if (!authCheck.success) {
        return NextResponse.json({ success: false, message: authCheck.error }, { status: 401 });
    }

    try {
        const products = await db.product.findMany({
            where: { isSold: false },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                category: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: products.map((p) => ({
                ...p,
                price: Number(p.price),
            })),
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, message: `เกิดข้อผิดพลาด: ${errorMessage}` },
            { status: 500 }
        );
    }
}
