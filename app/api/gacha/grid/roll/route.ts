import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { db } from "@/lib/db";

/** POST /api/gacha/grid/roll — pick a random reward from the pool and record it */
export async function POST(req: Request) {
    const auth = await isAuthenticated();
    if (!auth.success || !auth.userId) {
        return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({})) as { machineId?: string };
    const machineId = body.machineId ?? null;


    try {
        // Fetch machine settings (cost, etc.)
        let costType = "FREE";
        let costAmount = 0;
        if (machineId) {
            const machine = await (db as any).gachaMachine.findUnique({ where: { id: machineId } });
            if (!machine || !machine.isActive || !machine.isEnabled) {
                return NextResponse.json({ success: false, message: "ตู้กาชานี้ปิดอยู่ชั่วคราว" }, { status: 400 });
            }
            costType = machine.costType;
            costAmount = Number(machine.costAmount ?? 0);
        } else {
            // Fallback to global GachaSettings
            const settings = await db.gachaSettings.findFirst().catch(() => null);
            if (settings && !settings.isEnabled) {
                return NextResponse.json({ success: false, message: "ระบบกาชาปิดอยู่ชั่วคราว" }, { status: 400 });
            }
            costType = settings?.costType ?? "FREE";
            costAmount = Number(settings?.costAmount ?? 0);
        }

        // Check user balance
        const user = await db.user.findUnique({
            where: { id: auth.userId },
            select: { id: true, creditBalance: true, pointBalance: true },
        });
        if (!user) return NextResponse.json({ success: false, message: "ไม่พบผู้ใช้งาน" }, { status: 404 });

        if (costType === "CREDIT" && costAmount > 0 && Number(user.creditBalance) < costAmount) {
            return NextResponse.json({ success: false, message: "เครดิตไม่เพียงพอ" }, { status: 400 });
        }
        if (costType === "POINT" && costAmount > 0 && user.pointBalance < costAmount) {
            return NextResponse.json({ success: false, message: "พอยต์ไม่เพียงพอ" }, { status: 400 });
        }

        // Fetch reward pool
        const rewards = await (db as any).gachaReward.findMany({
            where: {
                isActive: true,
                ...(machineId ? { gachaMachineId: machineId } : { gachaMachineId: null }),
            },
            take: 9,
            include: { product: { select: { id: true, name: true, price: true, imageUrl: true, isSold: true } } },
        });

        const eligible = rewards.filter((r: any) =>
            r.rewardType === "PRODUCT" ? r.product && !r.product.isSold : true
        );

        if (eligible.length === 0) {
            return NextResponse.json({ success: false, message: "ไม่มีรางวัลในขณะนี้" }, { status: 400 });
        }

        const chosen = eligible[Math.floor(Math.random() * eligible.length)] as any;
        const rewardName = chosen.rewardType === "PRODUCT"
            ? chosen.product?.name ?? "รางวัล"
            : chosen.rewardName ?? (chosen.rewardType === "CREDIT" ? "เครดิต" : "พอยต์");
        const imageUrl = chosen.rewardType === "PRODUCT" ? chosen.product?.imageUrl : chosen.rewardImageUrl;
        const rewardAmount = chosen.rewardAmount ? Number(chosen.rewardAmount) : null;

        // Run in transaction: deduct cost + grant reward + log
        await db.$transaction(async (tx) => {
            if (costType === "CREDIT" && costAmount > 0) {
                await tx.user.update({ where: { id: user.id }, data: { creditBalance: { decrement: costAmount } } });
            }
            if (costType === "POINT" && costAmount > 0) {
                await tx.user.update({ where: { id: user.id }, data: { pointBalance: { decrement: costAmount } } });
            }
            if (chosen.rewardType === "CREDIT" && rewardAmount && rewardAmount > 0) {
                await tx.user.update({ where: { id: user.id }, data: { creditBalance: { increment: rewardAmount } } });
            }
            if (chosen.rewardType === "POINT" && rewardAmount && rewardAmount > 0) {
                await tx.user.update({ where: { id: user.id }, data: { pointBalance: { increment: rewardAmount } } });
            }
            await (tx as any).gachaRollLog.create({
                data: {
                    userId: user.id,
                    productId: chosen.rewardType === "PRODUCT" ? chosen.product?.id ?? null : null,
                    rewardName,
                    rewardImageUrl: imageUrl ?? null,
                    tier: chosen.tier ?? "common",
                    selectorLabel: "grid",
                    costType,
                    costAmount,
                    ...(machineId ? { gachaMachineId: machineId } : {}),
                },
            });
        });

        return NextResponse.json({
            success: true,
            data: {
                wonIndex: rewards.indexOf(chosen),
                rewardId: chosen.id,
                rewardName,
                rewardType: chosen.rewardType,
                rewardAmount,
                imageUrl: imageUrl ?? null,
                tier: chosen.tier ?? "common",
            },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
