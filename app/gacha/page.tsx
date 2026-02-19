import { db } from "@/lib/db";
import { Lock } from "lucide-react";
import { GachaRhombus } from "@/components/GachaRhombus";
import { type GachaProductLite, type GachaTier } from "@/lib/gachaGrid";

export const metadata = {
    title: "กาชา | Manashop",
    description: "ลุ้นรับไอเท็มสุดพิเศษจากระบบสุ่มกาชา Rhombus Grid",
};

export default async function GachaPage() {
    let settings = {
        isEnabled: true,
        costType: "FREE",
        costAmount: 0,
        dailySpinLimit: 0,
    };

    try {
        const raw = await db.gachaSettings.findFirst();
        if (raw) {
            settings = {
                isEnabled: raw.isEnabled ?? true,
                costType: raw.costType ?? "FREE",
                costAmount: Number(raw.costAmount ?? 0),
                dailySpinLimit: raw.dailySpinLimit ?? 0,
            };
        }
    } catch {
        // gachaSettings table might not exist yet
    }

    let products: GachaProductLite[] = [];
    try {
        const prisma = db as unknown as any;
        const rewards = await prisma.gachaReward.findMany({
            where: {
                isActive: true,
                OR: [
                    { rewardType: "PRODUCT", product: { isSold: false } },
                    { rewardType: "CREDIT" },
                    { rewardType: "POINT" },
                ],
            },
            include: {
                product: {
                    select: { id: true, name: true, price: true, imageUrl: true, isSold: true },
                },
            },
        });
        products = rewards
            .filter((r: any) => {
                if (r.rewardType === "PRODUCT") return r.product && !r.product.isSold;
                return true; // CREDIT / POINT always eligible
            })
            .map((r: any) => {
                if (r.rewardType === "PRODUCT") {
                    return {
                        id: r.product.id,
                        name: r.product.name,
                        price: Number(r.product.price),
                        imageUrl: r.product.imageUrl,
                        tier: (r.tier as GachaTier) ?? "common",
                    };
                }
                // Currency reward (CREDIT / POINT)
                return {
                    id: `reward:${r.id}`,
                    name: r.rewardName ?? (r.rewardType === "CREDIT" ? "เครดิต" : "พอยต์"),
                    price: Number(r.rewardAmount ?? 0),
                    imageUrl: r.rewardImageUrl ?? null,
                    tier: (r.tier as GachaTier) ?? "common",
                };
            });
    } catch {
        // rewards not available
    }

    return (
        <main className="bg-background">
            <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        🎲 กาชา
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        ลุ้นรับไอเท็มสุดพิเศษจากระบบสุ่ม Rhombus Grid
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-1">
                        {settings.costType !== "FREE" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-600 dark:text-violet-400">
                                💰 ค่าสุ่ม {settings.costAmount.toLocaleString()}{" "}
                                {settings.costType === "CREDIT" ? "฿" : "พอยต์"} / ครั้ง
                            </span>
                        )}
                        {settings.dailySpinLimit > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-semibold text-orange-600 dark:text-orange-400">
                                ⏱ จำกัด {settings.dailySpinLimit} ครั้ง / วัน
                            </span>
                        )}
                    </div>
                </div>

                {/* Gacha disabled */}
                {!settings.isEnabled ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-2xl border bg-muted/20">
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <p className="text-base font-semibold text-foreground">ระบบกาชาปิดอยู่ชั่วคราว</p>
                        <p className="text-sm text-muted-foreground">กรุณากลับมาใหม่ภายหลัง</p>
                    </div>
                ) : (
                    <div className="flex justify-center overflow-x-auto">
                        <div className="min-w-fit mx-auto">
                            <GachaRhombus products={products} settings={settings} />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
