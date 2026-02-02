import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";

// GET: ดึงรายการสินค้าทั้งหมด (สำหรับ dropdown เลือกสินค้า)
export async function GET() {
    try {
        const products = await db.product.findMany({
            where: { isSold: false },
            select: {
                id: true,
                name: true,
                imageUrl: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            products,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    // Check if user is admin
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
            title,
            price,
            discountPrice,
            discountType,
            discountValue,
            image,
            category,
            categoryBannerId,
            description,
            notes,
            purchaseNotes,
            secretData,
            currency,
            purchaseLimit
        } = body;

        // Validate required fields
        if (!title || !price || !category || !secretData) {
            return NextResponse.json(
                {
                    success: false,
                    message: "กรุณากรอกข้อมูลที่จำเป็น: ชื่อสินค้า, ราคา, หมวดหมู่ และข้อมูลลับ",
                },
                { status: 400 }
            );
        }

        // Validate price is a number
        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber) || priceNumber <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "ราคาต้องเป็นตัวเลขที่มากกว่า 0",
                },
                { status: 400 }
            );
        }

        // Process discount price (could be calculated or direct)
        let finalDiscountPrice: number | null = null;
        if (discountPrice !== undefined && discountPrice !== null && discountPrice !== "") {
            finalDiscountPrice = parseFloat(discountPrice);
            if (isNaN(finalDiscountPrice) || finalDiscountPrice < 0) {
                finalDiscountPrice = null;
            }
            if (finalDiscountPrice !== null && finalDiscountPrice >= priceNumber) {
                return NextResponse.json(
                    { success: false, message: "ราคาลดต้องน้อยกว่าราคาเต็ม" },
                    { status: 400 }
                );
            }
        }

        // Process discount value
        let discountValueNumber: number | null = null;
        if (discountValue !== undefined && discountValue !== "" && discountValue !== null) {
            discountValueNumber = parseFloat(discountValue);
            if (isNaN(discountValueNumber) || discountValueNumber < 0) {
                discountValueNumber = null;
            }
        }

        // Process purchase limit
        const purchaseLimitNumber = parseInt(purchaseLimit) || 0;

        // Create product in database
        const product = await db.product.create({
            data: {
                name: title,
                price: priceNumber,
                discountPrice: finalDiscountPrice,
                discountType: discountType || "FIXED",
                discountValue: discountValueNumber,
                imageUrl: image || null,
                category: category,
                categoryBannerId: categoryBannerId || null,
                currency: currency || "THB",
                description: description || null,
                notes: notes || null,
                purchaseNotes: purchaseNotes || null,
                purchaseLimit: purchaseLimitNumber,
                secretData: encrypt(secretData),
                isSold: false,
            },
        });

        return NextResponse.json({
            success: true,
            message: "สร้างสินค้าสำเร็จ",
            product: {
                id: product.id,
                name: product.name,
                price: product.price,
                category: product.category,
            },
        });
    } catch (error) {
        console.error("Create product error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "ไม่สามารถสร้างสินค้าได้",
            },
            { status: 500 }
        );
    }
}
