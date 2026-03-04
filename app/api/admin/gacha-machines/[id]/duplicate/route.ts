import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await isAdmin();
    if (!auth.success) return NextResponse.json({ success: false }, { status: 401 });

    try {
        const { id } = await params;
        const original = await db.gachaMachine.findUnique({
            where: { id },
            include: { rewards: true }
        });

        if (!original) return NextResponse.json({ success: false, message: "ไม่พบข้อมูลเดิม" }, { status: 404 });

        // Create duplicate
        const duplicate = await db.gachaMachine.create({
            data: {
                name: original.name + " (Copy)",
                description: original.description,
                imageUrl: original.imageUrl,
                gameType: original.gameType,
                categoryId: original.categoryId,
                costType: original.costType,
                costAmount: original.costAmount,
                dailySpinLimit: original.dailySpinLimit,
                tierMode: original.tierMode,
                isActive: false, // Inactive by default so admin can review
                isEnabled: original.isEnabled,
                sortOrder: original.sortOrder + 1,
            }
        });

        // Copy rewards (excluding productId for PRODUCT type because of @unique constraint)
        if (original.rewards && original.rewards.length > 0) {
            const newRewards = original.rewards.map(r => ({
                rewardType: r.rewardType,
                tier: r.tier,
                isActive: r.isActive,
                probability: r.probability,
                rewardName: r.rewardName,
                rewardAmount: r.rewardAmount,
                rewardImageUrl: r.rewardImageUrl,
                gachaMachineId: duplicate.id,
                // Do not copy productId
                productId: null,
            }));

            await db.gachaReward.createMany({
                data: newRewards
            });
        }

        return NextResponse.json({ success: true, data: duplicate });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}
