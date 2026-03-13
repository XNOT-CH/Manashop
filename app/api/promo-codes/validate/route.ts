import { NextRequest, NextResponse } from "next/server";
import { db, promoCodes } from "@/lib/db";
import { eq } from "drizzle-orm";

type ValidatePromoSource = { startsAt: Date | string; expiresAt: Date | string | null; usageLimit: number | null; usedCount: number; minPurchase: string | number | null };

function validatePromoConditions(promo: ValidatePromoSource, totalPrice: unknown): string | null {
    const now = new Date();
    if (now < new Date(promo.startsAt)) return "โค้ดนี้ยังไม่ถึงวันเริ่มใช้งาน";
    if (promo.expiresAt && now > new Date(promo.expiresAt)) return "โค้ดนี้หมดอายุแล้ว";
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) return "โค้ดนี้ถูกใช้ครบจำนวนแล้ว";
    
    const minPurchase = promo.minPurchase ? Number(promo.minPurchase) : null;
    if (minPurchase !== null && typeof totalPrice === "number" && totalPrice < minPurchase) {
        return `ต้องซื้อขั้นต่ำ ฿${minPurchase.toLocaleString()} เพื่อใช้โค้ดนี้`;
    }
    return null;
}

function calculateDiscount(promo: { discountValue: string | number; minPurchase: string | number | null; discountType: string; maxDiscount: string | number | null }, totalPrice: unknown) {
    const discountValue = Number(promo.discountValue);
    const minPurchase = promo.minPurchase ? Number(promo.minPurchase) : null;

    if (promo.discountType === "FIXED") {
        return { minPurchase, discountAmount: discountValue };
    }

    let discountAmount = typeof totalPrice === "number" ? (totalPrice * discountValue) / 100 : 0;
    const maxDiscount = promo.maxDiscount ? Number(promo.maxDiscount) : null;
    if (maxDiscount !== null && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
    }
    
    return { minPurchase, discountAmount };
}

export async function POST(request: NextRequest) {
    try {
        const { code, totalPrice } = await request.json();

        if (!code || typeof code !== "string") {
            return NextResponse.json({ valid: false, message: "กรุณากรอกโค้ดส่วนลด" });
        }

        const promo = await db.query.promoCodes.findFirst({
            where: eq(promoCodes.code, code.trim().toUpperCase()),
        });

        if (!promo) {
            return NextResponse.json({ valid: false, message: "โค้ดส่วนลดไม่ถูกต้อง" });
        }

        if (!promo.isActive) {
            return NextResponse.json({ valid: false, message: "โค้ดนี้ถูกปิดใช้งานแล้ว" });
        }

        const errorMsg = validatePromoConditions(promo, totalPrice);
        if (errorMsg) return NextResponse.json({ valid: false, message: errorMsg });

        const { minPurchase, discountAmount } = calculateDiscount(promo, totalPrice);

        return NextResponse.json({
            valid: true,
            discount: Number(promo.discountValue),
            discountType: promo.discountType,
            discountAmount: typeof totalPrice === "number" ? discountAmount : null,
            maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
            minPurchase,
            message: promo.discountType === "PERCENTAGE"
                ? `โค้ด "${promo.code}" ใช้ได้ ลด ${promo.discountValue}%`
                : `โค้ด "${promo.code}" ใช้ได้ ลด ฿${Number(promo.discountValue).toLocaleString()}`,
        });
    } catch (error) {
        console.error("Validate promo code error:", error);
        return NextResponse.json({ valid: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
    }
}
