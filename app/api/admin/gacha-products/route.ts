import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { getStockCount } from "@/lib/stock";

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
                secretData: true,
                stockSeparator: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: products.map((p) => {
                let stockCount = 0;
                try {
                    const decrypted = decrypt(p.secretData || "");
                    stockCount = getStockCount(decrypted, p.stockSeparator || "newline");
                } catch { stockCount = 0; }
                return {
                    id: p.id,
                    name: p.name,
                    price: Number(p.price),
                    imageUrl: p.imageUrl,
                    category: p.category,
                    stockCount,
                };
            }),
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, message: `เกิดข้อผิดพลาด: ${errorMessage}` },
            { status: 500 }
        );
    }
}

