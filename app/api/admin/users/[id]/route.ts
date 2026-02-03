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

        const {
            creditBalance,
            totalTopup,
            pointBalance,
            lifetimePoints,
            roleId,
            isVerified,
            isInfluencer
        } = body;

        // Validate that at least one field is provided
        if (
            creditBalance === undefined &&
            totalTopup === undefined &&
            pointBalance === undefined &&
            lifetimePoints === undefined &&
            roleId === undefined &&
            isVerified === undefined &&
            isInfluencer === undefined
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
            roleId?: string | null;
            isVerified?: boolean;
            isInfluencer?: boolean;
        } = {};

        // Max value for Decimal(10,2) is 99,999,999.99
        const MAX_DECIMAL_VALUE = 99999999.99;

        if (creditBalance !== undefined) {
            const value = parseFloat(creditBalance);
            if (isNaN(value) || value < 0) {
                return NextResponse.json(
                    { error: "เครดิตคงเหลือต้องเป็นตัวเลขที่ไม่ติดลบ" },
                    { status: 400 }
                );
            }
            if (value > MAX_DECIMAL_VALUE) {
                return NextResponse.json(
                    { error: `เครดิตคงเหลือต้องไม่เกิน ${MAX_DECIMAL_VALUE.toLocaleString()} บาท` },
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
            if (value > MAX_DECIMAL_VALUE) {
                return NextResponse.json(
                    { error: `ยอดเติมสะสมต้องไม่เกิน ${MAX_DECIMAL_VALUE.toLocaleString()} บาท` },
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

        // Handle role assignment
        if (roleId !== undefined) {
            if (roleId === null || roleId === "") {
                // Allow clearing the role
                updateData.roleId = null;
            } else {
                // Validate that the role exists
                const role = await db.role.findUnique({
                    where: { id: roleId },
                });

                if (!role) {
                    return NextResponse.json(
                        { error: "ไม่พบยศที่เลือก" },
                        { status: 400 }
                    );
                }

                updateData.roleId = roleId;
            }
        }

        // Handle special badges
        if (isVerified !== undefined) {
            updateData.isVerified = isVerified;
        }

        if (isInfluencer !== undefined) {
            updateData.isInfluencer = isInfluencer;
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
                isVerified: updatedUser.isVerified,
                isInfluencer: updatedUser.isInfluencer,
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
