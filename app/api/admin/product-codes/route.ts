import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Helper: ตรวจสอบว่าเป็น Admin หรือไม่
async function isAdmin() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) return false;

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    return user?.role === "ADMIN";
}

// GET: ดึงรายการรหัสทั้งหมด (filter by productId, isSold)
export async function GET(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const isSold = searchParams.get("isSold");

        const where: {
            productId?: string;
            isSold?: boolean;
        } = {};

        if (productId) {
            where.productId = productId;
        }

        if (isSold !== null && isSold !== "") {
            where.isSold = isSold === "true";
        }

        const codes = await db.productCode.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        userId: true,
                        purchasedAt: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // นับสรุปจำนวน
        const summary = await db.productCode.groupBy({
            by: ["productId", "isSold"],
            _count: true,
        });

        return NextResponse.json({
            success: true,
            codes,
            summary,
        });
    } catch (error) {
        console.error("Error fetching product codes:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        );
    }
}

// POST: เพิ่มรหัสใหม่ (single)
export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { productId, code } = body;

        if (!productId || !code) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุสินค้าและรหัส" },
                { status: 400 }
            );
        }

        // ตรวจสอบว่าสินค้ามีอยู่จริง
        const product = await db.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json(
                { success: false, message: "ไม่พบสินค้านี้" },
                { status: 404 }
            );
        }

        // เพิ่มรหัสใหม่
        const newCode = await db.productCode.create({
            data: {
                productId,
                code: code.trim(),
            },
        });

        return NextResponse.json({
            success: true,
            message: "เพิ่มรหัสสำเร็จ",
            code: newCode,
        });
    } catch (error) {
        console.error("Error creating product code:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการเพิ่มรหัส" },
            { status: 500 }
        );
    }
}
