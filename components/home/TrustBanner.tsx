"use client";

import { Gamepad2, ShieldCheck, ThumbsUp } from "lucide-react";

const features = [
    {
        icon: Gamepad2,
        title: "สินค้าหลากหลาย",
        description: "รวมไอดีเกมดังและบริการครบจบในที่เดียว",
        color: "bg-blue-500/10",
        iconColor: "text-blue-500",
    },
    {
        icon: ShieldCheck,
        title: "ปลอดภัย 100%",
        description: "รับประกันสินค้าทุกชิ้น ไม่มีการดึงคืน",
        color: "bg-green-500/10",
        iconColor: "text-green-500",
    },
    {
        icon: ThumbsUp,
        title: "บริการประทับใจ",
        description: "แอดมินดูแลดี ตอบไว ตลอด 24 ชม.",
        color: "bg-orange-500/10",
        iconColor: "text-orange-500",
    },
];

export default function TrustBanner() {
    return (
        <section className="py-10 px-4 bg-white dark:bg-card border-b border-gray-100 dark:border-border">
            <div className="max-w-6xl mx-auto">
                {/* Sub-headline */}
                <p className="text-center text-sm text-muted-foreground mb-2">
                    ยินดีต้อนรับสู่ Game ID Marketplace
                </p>

                {/* Main Headline */}
                <h2 className="text-center text-2xl md:text-3xl font-bold text-foreground mb-8">
                    ร้านจำหน่ายไอดี เกมและ บริการต่างๆ ที่เกมเมอร์ ไว้ใจ
                </h2>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:shadow-md"
                            >
                                <div className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center mb-4`}>
                                    <Icon className={`h-8 w-8 ${feature.iconColor}`} />
                                </div>
                                <h3 className="font-semibold text-lg text-foreground mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
