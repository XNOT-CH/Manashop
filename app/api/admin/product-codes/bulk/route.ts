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

// POST: นำเข้ารหัสแบบ bulk (1 บรรทัด = 1 รหัส)
export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { productId, codes } = body;

        if (!productId || !codes) {
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

        // แปลง codes string เป็น array (1 บรรทัด = 1 รหัส)
        const codeList = codes
            .split("\n")
            .map((c: string) => c.trim())
            .filter((c: string) => c.length > 0);

        if (codeList.length === 0) {
            return NextResponse.json(
                { success: false, message: "ไม่พบรหัสที่ถูกต้อง" },
                { status: 400 }
            );
        }

        // เพิ่มรหัสทั้งหมดพร้อมกัน
        const result = await db.productCode.createMany({
            data: codeList.map((code: string) => ({
                productId,
                code,
            })),
        });

        return NextResponse.json({
            success: true,
            message: `นำเข้าสำเร็จ ${result.count} รหัส`,
            count: result.count,
        });
    } catch (error) {
        console.error("Error bulk creating product codes:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการนำเข้ารหัส" },
            { status: 500 }
        );
    }
}
