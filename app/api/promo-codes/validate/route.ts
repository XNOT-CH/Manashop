import { NextRequest, NextResponse } from "next/server";
import { db, promoCodes } from "@/lib/db";
import { eq } from "drizzle-orm";

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

        const now = new Date();
        const startsAt = new Date(promo.startsAt);
        if (now < startsAt) {
            return NextResponse.json({ valid: false, message: "โค้ดนี้ยังไม่ถึงวันเริ่มใช้งาน" });
        }

        if (promo.expiresAt) {
            const expiresAt = new Date(promo.expiresAt);
            if (now > expiresAt) {
                return NextResponse.json({ valid: false, message: "โค้ดนี้หมดอายุแล้ว" });
            }
        }

        if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
            return NextResponse.json({ valid: false, message: "โค้ดนี้ถูกใช้ครบจำนวนแล้ว" });
        }

        const discountValue = Number(promo.discountValue);
        const minPurchase = promo.minPurchase ? Number(promo.minPurchase) : null;

        // Check minimum purchase if provided
        if (minPurchase !== null && typeof totalPrice === "number" && totalPrice < minPurchase) {
            return NextResponse.json({
                valid: false,
                message: `ต้องซื้อขั้นต่ำ ฿${minPurchase.toLocaleString()} เพื่อใช้โค้ดนี้`,
            });
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (promo.discountType === "PERCENTAGE") {
            discountAmount = typeof totalPrice === "number" ? (totalPrice * discountValue) / 100 : 0;
            const maxDiscount = promo.maxDiscount ? Number(promo.maxDiscount) : null;
            if (maxDiscount !== null && discountAmount > maxDiscount) {
                discountAmount = maxDiscount;
            }
        } else {
            // FIXED amount
            discountAmount = discountValue;
        }

        return NextResponse.json({
            valid: true,
            discount: discountValue,
            discountType: promo.discountType,
            discountAmount: typeof totalPrice === "number" ? discountAmount : null,
            maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
            minPurchase,
            message: promo.discountType === "PERCENTAGE"
                ? `โค้ด "${promo.code}" ใช้ได้ ลด ${discountValue}%`
                : `โค้ด "${promo.code}" ใช้ได้ ลด ฿${discountValue.toLocaleString()}`,
        });
    } catch (error) {
        console.error("Validate promo code error:", error);
        return NextResponse.json({ valid: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" }, { status: 500 });
    }
}
