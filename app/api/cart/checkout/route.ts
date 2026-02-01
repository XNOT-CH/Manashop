import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const { productIds } = await request.json();

        // Validate input
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json(
                { success: false, message: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ" },
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
            // Fetch all products
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
            });

            // Validate all products exist
            if (products.length !== productIds.length) {
                throw new Error("บางสินค้าไม่พบในระบบ");
            }

            // Check if any product is already sold
            const soldProducts = products.filter((p) => p.isSold);
            if (soldProducts.length > 0) {
                const error: Error & { soldProductIds?: string[] } = new Error(
                    `สินค้าบางรายการถูกขายไปแล้ว: ${soldProducts.map((p) => p.name).join(", ")}`
                );
                error.soldProductIds = soldProducts.map((p) => p.id);
                throw error;
            }

            // Separate products by currency type
            const thbProducts = products.filter((p) => p.currency === "THB" || !p.currency);
            const pointProducts = products.filter((p) => p.currency === "POINT");

            // Calculate totals for each currency
            const totalTHB = thbProducts.reduce((sum, product) => {
                const price = product.discountPrice
                    ? Number(product.discountPrice)
                    : Number(product.price);
                return sum + price;
            }, 0);

            const totalPoints = pointProducts.reduce((sum, product) => {
                const price = product.discountPrice
                    ? Number(product.discountPrice)
                    : Number(product.price);
                return sum + price;
            }, 0);

            const userCreditBalance = Number(user.creditBalance);
            const userPointBalance = user.pointBalance || 0;

            // Check if user has enough THB balance
            if (totalTHB > 0 && userCreditBalance < totalTHB) {
                throw new Error(
                    `เครดิตไม่เพียงพอ (ต้องการ ฿${totalTHB.toLocaleString()} แต่มี ฿${userCreditBalance.toLocaleString()})`
                );
            }

            // Check if user has enough POINT balance
            if (totalPoints > 0 && userPointBalance < totalPoints) {
                throw new Error(
                    `Point ไม่เพียงพอ (ต้องการ 💎${totalPoints.toLocaleString()} แต่มี 💎${userPointBalance.toLocaleString()})`
                );
            }

            // Create orders and update products
            const orders = [];
            for (const product of products) {
                const productPrice = product.discountPrice
                    ? product.discountPrice
                    : product.price;

                // Create order
                const order = await tx.order.create({
                    data: {
                        userId: user.id,
                        totalPrice: productPrice,
                        status: "COMPLETED",
                    },
                });

                // Update product: set isSold = true and link to order
                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        isSold: true,
                        orderId: order.id,
                    },
                });

                orders.push({
                    orderId: order.id,
                    productName: product.name,
                    price: Number(productPrice),
                    currency: product.currency || "THB",
                });
            }

            // Decrement THB balance if needed
            if (totalTHB > 0) {
                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        creditBalance: {
                            decrement: totalTHB,
                        },
                    },
                });
            }

            // Decrement POINT balance if needed
            if (totalPoints > 0) {
                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        pointBalance: {
                            decrement: totalPoints,
                        },
                    },
                });
            }

            return { orders, totalTHB, totalPoints };
        });

        return NextResponse.json({
            success: true,
            message: "ซื้อสำเร็จ! 🎉",
            purchasedCount: result.orders.length,
            totalTHB: result.totalTHB,
            totalPoints: result.totalPoints,
            orders: result.orders,
        });
    } catch (error) {
        console.error("Cart checkout error:", error);

        // Check if error has soldProductIds
        const soldProductIds = (error as Error & { soldProductIds?: string[] }).soldProductIds;

        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการซื้อ",
                soldProductIds: soldProductIds || [],
            },
            { status: 400 }
        );
    }
}
