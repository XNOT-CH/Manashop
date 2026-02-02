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

// PUT: แก้ไขรหัส (เฉพาะที่ยังไม่ขาย)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุรหัสใหม่" },
                { status: 400 }
            );
        }

        // ตรวจสอบว่ารหัสมีอยู่จริงและยังไม่ขาย
        const existingCode = await db.productCode.findUnique({
            where: { id },
        });

        if (!existingCode) {
            return NextResponse.json(
                { success: false, message: "ไม่พบรหัสนี้" },
                { status: 404 }
            );
        }

        if (existingCode.isSold) {
            return NextResponse.json(
                { success: false, message: "ไม่สามารถแก้ไขรหัสที่ขายแล้ว" },
                { status: 400 }
            );
        }

        // อัพเดทรหัส
        const updatedCode = await db.productCode.update({
            where: { id },
            data: { code: code.trim() },
        });

        return NextResponse.json({
            success: true,
            message: "แก้ไขรหัสสำเร็จ",
            code: updatedCode,
        });
    } catch (error) {
        console.error("Error updating product code:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการแก้ไขรหัส" },
            { status: 500 }
        );
    }
}

// DELETE: ลบรหัส (เฉพาะที่ยังไม่ขาย)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // ตรวจสอบว่ารหัสมีอยู่จริงและยังไม่ขาย
        const existingCode = await db.productCode.findUnique({
            where: { id },
        });

        if (!existingCode) {
            return NextResponse.json(
                { success: false, message: "ไม่พบรหัสนี้" },
                { status: 404 }
            );
        }

        if (existingCode.isSold) {
            return NextResponse.json(
                { success: false, message: "ไม่สามารถลบรหัสที่ขายแล้ว" },
                { status: 400 }
            );
        }

        // ลบรหัส
        await db.productCode.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "ลบรหัสสำเร็จ",
        });
    } catch (error) {
        console.error("Error deleting product code:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการลบรหัส" },
            { status: 500 }
        );
    }
}
