import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// PATCH /api/admin/users/[id] - Update user credit/points
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { creditBalance, totalTopup, pointBalance, lifetimePoints, role } = body;

        // Validate that at least one field is provided
        if (
            creditBalance === undefined &&
            totalTopup === undefined &&
            pointBalance === undefined &&
            lifetimePoints === undefined &&
            role === undefined
        ) {
            return NextResponse.json(
                { error: "ต้องระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 ฟิลด์" },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "ไม่พบผู้ใช้" },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: {
            creditBalance?: Decimal;
            totalTopup?: Decimal;
            pointBalance?: number;
            lifetimePoints?: number;
            role?: string;
        } = {};

        if (creditBalance !== undefined) {
            const value = parseFloat(creditBalance);
            if (isNaN(value) || value < 0) {
                return NextResponse.json(
                    { error: "เครดิตคงเหลือต้องเป็นตัวเลขที่ไม่ติดลบ" },
                    { status: 400 }
                );
            }
            updateData.creditBalance = new Decimal(value);
        }

        if (totalTopup !== undefined) {
            const value = parseFloat(totalTopup);
            if (isNaN(value) || value < 0) {
                return NextResponse.json(
                    { error: "ยอดเติมสะสมต้องเป็นตัวเลขที่ไม่ติดลบ" },
                    { status: 400 }
                );
            }
            updateData.totalTopup = new Decimal(value);
        }

        if (pointBalance !== undefined) {
            const value = parseInt(pointBalance);
            if (isNaN(value) || value < 0) {
                return NextResponse.json(
                    { error: "พอยต์คงเหลือต้องเป็นจำนวนเต็มที่ไม่ติดลบ" },
                    { status: 400 }
                );
            }
            updateData.pointBalance = value;
        }

        if (lifetimePoints !== undefined) {
            const value = parseInt(lifetimePoints);
            if (isNaN(value) || value < 0) {
                return NextResponse.json(
                    { error: "พอยต์สะสมต้องเป็นจำนวนเต็มที่ไม่ติดลบ" },
                    { status: 400 }
                );
            }
            updateData.lifetimePoints = value;
        }

        if (role !== undefined && typeof role === 'string' && role.trim()) {
            updateData.role = role.trim().toUpperCase();
        }

        // Update user
        const updatedUser = await db.user.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                creditBalance: updatedUser.creditBalance.toString(),
                totalTopup: updatedUser.totalTopup.toString(),
                pointBalance: updatedUser.pointBalance,
                lifetimePoints: updatedUser.lifetimePoints,
                role: updatedUser.role,
            },
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการอัปเดตผู้ใช้" },
            { status: 500 }
        );
    }
}
