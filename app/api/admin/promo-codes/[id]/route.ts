import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Get single promo code
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authCheck = await isAdmin();
    if (!authCheck.success) {
        return NextResponse.json(
            { success: false, message: authCheck.error },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        const promoCode = await db.promoCode.findUnique({
            where: { id },
        });

        if (!promoCode) {
            return NextResponse.json(
                { success: false, message: "Promo code not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...promoCode,
                discountValue: Number(promoCode.discountValue),
                minPurchase: promoCode.minPurchase ? Number(promoCode.minPurchase) : null,
                maxDiscount: promoCode.maxDiscount ? Number(promoCode.maxDiscount) : null,
            },
        });
    } catch (error) {
        console.error("Get promo code error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch promo code" },
            { status: 500 }
        );
    }
}

// PUT - Update promo code
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authCheck = await isAdmin();
    if (!authCheck.success) {
        return NextResponse.json(
            { success: false, message: authCheck.error },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const {
            code,
            discountType,
            discountValue,
            minPurchase,
            maxDiscount,
            usageLimit,
            startsAt,
            expiresAt,
            isActive,
        } = body;

        // Check if promo code exists
        const existingCode = await db.promoCode.findUnique({
            where: { id },
        });

        if (!existingCode) {
            return NextResponse.json(
                { success: false, message: "Promo code not found" },
                { status: 404 }
            );
        }

        // Check if new code conflicts with another
        if (code && code.toUpperCase() !== existingCode.code) {
            const codeConflict = await db.promoCode.findUnique({
                where: { code: code.toUpperCase() },
            });
            if (codeConflict) {
                return NextResponse.json(
                    { success: false, message: "Promo code already exists" },
                    { status: 400 }
                );
            }
        }

        // Update promo code
        const updatedCode = await db.promoCode.update({
            where: { id },
            data: {
                code: code ? code.toUpperCase() : undefined,
                discountType: discountType || undefined,
                discountValue: discountValue ? parseFloat(discountValue) : undefined,
                minPurchase: minPurchase !== undefined ? (minPurchase ? parseFloat(minPurchase) : null) : undefined,
                maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseFloat(maxDiscount) : null) : undefined,
                usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit) : null) : undefined,
                startsAt: startsAt ? new Date(startsAt) : undefined,
                expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Promo code updated successfully",
            data: updatedCode,
        });
    } catch (error) {
        console.error("Update promo code error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to update promo code",
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete promo code
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authCheck = await isAdmin();
    if (!authCheck.success) {
        return NextResponse.json(
            { success: false, message: authCheck.error },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;

        const existingCode = await db.promoCode.findUnique({
            where: { id },
        });

        if (!existingCode) {
            return NextResponse.json(
                { success: false, message: "Promo code not found" },
                { status: 404 }
            );
        }

        await db.promoCode.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Promo code deleted successfully",
        });
    } catch (error) {
        console.error("Delete promo code error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to delete promo code",
            },
            { status: 500 }
        );
    }
}
