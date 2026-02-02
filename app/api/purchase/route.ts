import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json(
                { success: false, message: "Product ID is required" },
                { status: 400 }
            );
        }

        // Get logged-in user from cookie
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "กรุณาเข้าสู่ระบบก่อน" },
                { status: 401 }
            );
        }

        // Find the actual logged-in user
        const user = await db.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "ไม่พบผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่" },
                { status: 404 }
            );
        }

        // Use transaction for atomic operations
        const result = await db.$transaction(async (tx) => {
            // Fetch product with available codes
            const product = await tx.product.findUnique({
                where: { id: productId },
                include: {
                    codes: {
                        where: { isSold: false },
                        take: 1,
                    },
                },
            });

            if (!product) {
                throw new Error("ไม่พบสินค้านี้ในระบบ");
            }

            // ตรวจสอบว่ามีรหัสในคลังหรือไม่
            const hasInventoryCodes = product.codes.length > 0;
            const hasLegacySecretData = product.secretData && product.secretData.trim() !== "";

            // ถ้าไม่มี inventory codes และไม่มี secretData หรือ product ขายแล้ว
            if (!hasInventoryCodes && !hasLegacySecretData) {
                throw new Error("สินค้าหมด (ไม่มีรหัสในคลัง)");
            }

            // ถ้าใช้ legacy secretData และขายแล้ว
            if (!hasInventoryCodes && product.isSold) {
                throw new Error("สินค้านี้ถูกขายไปแล้ว");
            }

            // ใช้ราคาลด (discountPrice) ถ้ามี ไม่งั้นใช้ราคาเต็ม
            const productPrice = Number(product.discountPrice ?? product.price);
            const userBalance = Number(user.creditBalance);

            // Check if user has enough balance
            if (userBalance < productPrice) {
                throw new Error(`เครดิตไม่เพียงพอ (ต้องการ ฿${productPrice.toLocaleString()} แต่มี ฿${userBalance.toLocaleString()})`);
            }

            // Create order first
            const order = await tx.order.create({
                data: {
                    userId: user.id,
                    totalPrice: productPrice,
                    status: "COMPLETED",
                },
            });

            // Update user: decrement creditBalance
            await tx.user.update({
                where: { id: user.id },
                data: {
                    creditBalance: {
                        decrement: productPrice,
                    },
                },
            });

            let secretCode: string | null = null;

            if (hasInventoryCodes) {
                // ใช้รหัสจาก ProductCode inventory
                const codeToSell = product.codes[0];

                await tx.productCode.update({
                    where: { id: codeToSell.id },
                    data: {
                        isSold: true,
                        soldAt: new Date(),
                        orderId: order.id,
                    },
                });

                secretCode = codeToSell.code;

                // ตรวจสอบว่าเหลือรหัสในคลังหรือไม่
                const remainingCodes = await tx.productCode.count({
                    where: {
                        productId: product.id,
                        isSold: false,
                    },
                });

                // ถ้าหมด ให้ mark product ว่า sold (optional: สำหรับแสดงสถานะ)
                if (remainingCodes === 0) {
                    await tx.product.update({
                        where: { id: productId },
                        data: {
                            isSold: true,
                            orderId: order.id,
                        },
                    });
                }
            } else {
                // Legacy mode: ใช้ secretData
                secretCode = product.secretData;

                // Update product: set isSold = true and link to order
                await tx.product.update({
                    where: { id: productId },
                    data: {
                        isSold: true,
                        orderId: order.id,
                    },
                });
            }

            return { order, product, secretCode };
        });

        return NextResponse.json({
            success: true,
            message: "ซื้อสำเร็จ! 🎉",
            orderId: result.order.id,
            productName: result.product.name,
            secretCode: result.secretCode,
        });
    } catch (error) {
        console.error("Purchase error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการซื้อ",
            },
            { status: 400 }
        );
    }
}
