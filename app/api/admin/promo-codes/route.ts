import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

// GET - List all promo codes (ADMIN ONLY)
export async function GET() {
    const authCheck = await isAdmin();
    if (!authCheck.success) {
        return NextResponse.json(
            { success: false, message: authCheck.error },
            { status: 401 }
        );
    }

    try {
        const promoCodes = await db.promoCode.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            data: promoCodes.map((code) => ({
                ...code,
                discountValue: Number(code.discountValue),
                minPurchase: code.minPurchase ? Number(code.minPurchase) : null,
                maxDiscount: code.maxDiscount ? Number(code.maxDiscount) : null,
            })),
        });
    } catch (error) {
        console.error("Get promo codes error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch promo codes" },
            { status: 500 }
        );
    }
}

// POST - Create new promo code (ADMIN ONLY)
export async function POST(request: NextRequest) {
    const authCheck = await isAdmin();
    if (!authCheck.success) {
        return NextResponse.json(
            { success: false, message: authCheck.error },
            { status: 401 }
        );
    }

    try {
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

        // Validate required fields
        if (!code || !discountValue) {
            return NextResponse.json(
                { success: false, message: "Code and discount value are required" },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existingCode = await db.promoCode.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (existingCode) {
            return NextResponse.json(
                { success: false, message: "Promo code already exists" },
                { status: 400 }
            );
        }

        // Create promo code
        const promoCode = await db.promoCode.create({
            data: {
                code: code.toUpperCase(),
                discountType: discountType || "PERCENTAGE",
                discountValue: parseFloat(discountValue),
                minPurchase: minPurchase ? parseFloat(minPurchase) : null,
                maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                startsAt: startsAt ? new Date(startsAt) : new Date(),
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Promo code created successfully",
            data: promoCode,
        });
    } catch (error) {
        console.error("Create promo code error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to create promo code",
            },
            { status: 500 }
        );
    }
}
