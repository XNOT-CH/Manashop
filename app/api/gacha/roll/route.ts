import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { decrypt, encrypt } from "@/lib/encryption";
import { takeFirstStock } from "@/lib/stock";
import {
    buildGrid,
    getPathItemProductIds,
    getValidSelectors,
    type GachaProductLite,
    type GachaTier,
} from "@/lib/gachaGrid";

function getDayRange(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

export async function POST() {
    const authCheck = await isAuthenticated();
    if (!authCheck.success || !authCheck.userId) {
        return NextResponse.json({ success: false, message: authCheck.error }, { status: 401 });
    }

    try {
        const prisma = db as unknown as any;
        let settings;
        try {
            settings = await db.gachaSettings.findFirst();
        } catch {
            settings = null;
        }

        const isEnabled = settings?.isEnabled ?? true;
        const costType = settings?.costType ?? "FREE";
        const costAmount = Number(settings?.costAmount ?? 0);
        const dailySpinLimit = settings?.dailySpinLimit ?? 0;

        if (!isEnabled) {
            return NextResponse.json({ success: false, message: "ระบบกาชาปิดอยู่ชั่วคราว" }, { status: 400 });
        }

        const now = new Date();
        const { start, end } = getDayRange(now);

        if (dailySpinLimit > 0) {
            const todayCount = await prisma.gachaRollLog.count({
                where: { userId: authCheck.userId, createdAt: { gte: start, lte: end } },
            });

            if (todayCount >= dailySpinLimit) {
                return NextResponse.json(
                    { success: false, message: `คุณสุ่มครบ ${dailySpinLimit} ครั้ง/วันแล้ว` },
                    { status: 400 }
                );
            }
        }

        const user = await db.user.findUnique({
            where: { id: authCheck.userId },
            select: { id: true, creditBalance: true, pointBalance: true },
        });

        if (!user) {
            return NextResponse.json({ success: false, message: "ไม่พบผู้ใช้งาน" }, { status: 404 });
        }

        if (costType === "CREDIT" && costAmount > 0) {
            if (Number(user.creditBalance) < costAmount) {
                return NextResponse.json({ success: false, message: "เครดิตไม่เพียงพอ" }, { status: 400 });
            }
        }

        if (costType === "POINT" && costAmount > 0) {
            if (user.pointBalance < costAmount) {
                return NextResponse.json({ success: false, message: "พอยต์ไม่เพียงพอ" }, { status: 400 });
            }
        }

        // Fetch all active rewards — product rewards (unsold) + currency rewards (credit/point)
        const allRewards = await prisma.gachaReward.findMany({
            where: { isActive: true },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        imageUrl: true,
                        secretData: true,
                        stockSeparator: true,
                        isSold: true,
                        orderId: true,
                    },
                },
            },
        });

        type RewardRow = (typeof allRewards)[number];

        // Build the tiered list — product rewards only when product is not sold
        const tieredProducts: GachaProductLite[] = allRewards
            .filter((r: RewardRow) => {
                if (r.rewardType === "PRODUCT") return r.product && !r.product.isSold;
                return true; // CREDIT / POINT always eligible
            })
            .map((r: RewardRow) => {
                if (r.rewardType === "PRODUCT") {
                    return {
                        id: r.product.id,
                        name: r.product.name,
                        price: Number(r.product.price),
                        imageUrl: r.product.imageUrl,
                        tier: (r.tier as GachaTier) ?? "common",
                    };
                }
                // Currency reward — use the GachaReward id as fake product id
                return {
                    id: `reward:${r.id}`, // prefix so we can identify later
                    name: r.rewardName ?? (r.rewardType === "CREDIT" ? "เครดิต" : "พอยต์"),
                    price: Number(r.rewardAmount ?? 0),
                    imageUrl: r.rewardImageUrl ?? null,
                    tier: (r.tier as GachaTier) ?? "common",
                };
            });

        if (tieredProducts.length === 0) {
            return NextResponse.json({ success: false, message: "ไม่มีรางวัลสำหรับกาชาในขณะนี้" }, { status: 400 });
        }

        const tiles = buildGrid(tieredProducts);
        const validSelectors = getValidSelectors(tiles);
        if (validSelectors.length === 0) {
            return NextResponse.json({ success: false, message: "ไม่มีแถวที่สุ่มได้" }, { status: 400 });
        }

        const selectorLabel = validSelectors[Math.floor(Math.random() * validSelectors.length)];
        const candidateProductIds = getPathItemProductIds(tiles, selectorLabel);
        if (candidateProductIds.length === 0) {
            return NextResponse.json({ success: false, message: "ไม่มีไอเท็มในแถวนี้" }, { status: 400 });
        }

        const chosenId = candidateProductIds[Math.floor(Math.random() * candidateProductIds.length)];
        const rewardMeta = tieredProducts.find((p) => p.id === chosenId);
        const tier: GachaTier = rewardMeta?.tier ?? "common";

        // Determine if this is a currency reward
        const isCurrencyReward = chosenId.startsWith("reward:");
        const rewardRowId = isCurrencyReward ? chosenId.replace("reward:", "") : null;
        const chosenRewardRow: RewardRow | undefined = rewardRowId
            ? allRewards.find((r: RewardRow) => r.id === rewardRowId)
            : undefined;

        if (isCurrencyReward) {
            // Handle CREDIT / POINT reward in transaction
            const rewardType = chosenRewardRow?.rewardType as "CREDIT" | "POINT";
            const rewardAmount = Number(chosenRewardRow?.rewardAmount ?? 0);

            await db.$transaction(async (tx) => {
                const txx = tx as unknown as any;

                // Deduct spin cost
                if (costType === "CREDIT" && costAmount > 0) {
                    await tx.user.update({ where: { id: user.id }, data: { creditBalance: { decrement: costAmount } } });
                }
                if (costType === "POINT" && costAmount > 0) {
                    await tx.user.update({ where: { id: user.id }, data: { pointBalance: { decrement: costAmount } } });
                }

                // Add reward to user balance
                if (rewardType === "CREDIT" && rewardAmount > 0) {
                    await tx.user.update({ where: { id: user.id }, data: { creditBalance: { increment: rewardAmount } } });
                }
                if (rewardType === "POINT" && rewardAmount > 0) {
                    await tx.user.update({ where: { id: user.id }, data: { pointBalance: { increment: rewardAmount } } });
                }

                // Log
                await txx.gachaRollLog.create({
                    data: {
                        userId: user.id,
                        productId: null,
                        tier,
                        selectorLabel,
                        costType,
                        costAmount,
                    },
                });
            });

            return NextResponse.json({
                success: true,
                data: {
                    selectorLabel,
                    tier,
                    orderId: null,
                    product: {
                        id: chosenId,
                        name: rewardMeta?.name ?? "รางวัล",
                        price: rewardMeta?.price ?? 0,
                        imageUrl: rewardMeta?.imageUrl ?? null,
                        tier,
                        rewardType,
                        rewardAmount,
                    },
                },
            });
        }

        // --- Standard PRODUCT reward flow ---
        const result = await db.$transaction(async (tx) => {
            const txx = tx as unknown as any;
            const product = await tx.product.findUnique({
                where: { id: chosenId },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    imageUrl: true,
                    isSold: true,
                    orderId: true,
                    secretData: true,
                    stockSeparator: true,
                },
            });

            if (!product || product.isSold || product.orderId) {
                throw new Error("รางวัลนี้ถูกใช้ไปแล้ว กรุณาสุ่มใหม่");
            }

            const decrypted = decrypt(product.secretData || "");
            const [taken, remainingData] = takeFirstStock(decrypted, product.stockSeparator || "newline");
            if (!taken) {
                throw new Error("สต็อกของรางวัลหมดแล้ว");
            }

            const isLastStock = !remainingData || remainingData.trim().length === 0;

            const order = await tx.order.create({
                data: {
                    userId: user.id,
                    totalPrice: costAmount,
                    status: "COMPLETED",
                    givenData: encrypt(taken),
                },
            });

            if (costType === "CREDIT" && costAmount > 0) {
                await tx.user.update({ where: { id: user.id }, data: { creditBalance: { decrement: costAmount } } });
            }
            if (costType === "POINT" && costAmount > 0) {
                await tx.user.update({ where: { id: user.id }, data: { pointBalance: { decrement: costAmount } } });
            }

            await tx.product.update({
                where: { id: product.id },
                data: {
                    secretData: isLastStock ? encrypt(taken) : encrypt(remainingData),
                    isSold: isLastStock,
                    orderId: order.id,
                },
            });

            await txx.gachaRollLog.create({
                data: {
                    userId: user.id,
                    productId: product.id,
                    tier,
                    selectorLabel,
                    costType,
                    costAmount,
                },
            });

            return {
                orderId: order.id,
                product: {
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    imageUrl: product.imageUrl,
                    tier,
                },
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                selectorLabel,
                tier,
                orderId: result.orderId,
                product: result.product,
            },
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ success: false, message: `เกิดข้อผิดพลาด: ${errorMessage}` }, { status: 500 });
    }
}
