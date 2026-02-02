"use client";

import { Shield, Clock, Headphones, Award } from "lucide-react";

const features = [
    {
        icon: Shield,
        title: "ปลอดภัย 100%",
        description: "ระบบรักษาความปลอดภัยมาตรฐานสูง",
    },
    {
        icon: Clock,
        title: "ส่งทันที",
        description: "รับสินค้าอัตโนมัติหลังชำระเงิน",
    },
    {
        icon: Headphones,
        title: "ซัพพอร์ต 24/7",
        description: "ทีมงานพร้อมช่วยเหลือตลอดเวลา",
    },
    {
        icon: Award,
        title: "รับประกันคุณภาพ",
        description: "สินค้าคุณภาพ การันตีความพอใจ",
    },
];

export default function TrustBanner() {
    return (
        <section className="py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Main Headline */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                        ซื้อขายปลอดภัย 100%
                    </h2>
                    <p className="text-xl md:text-2xl font-medium text-primary">
                        ร้านจำหน่ายไอดีและบริการเกมที่คุณวางใจได้
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/50">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-accent/50 transition-colors"
                            >
                                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                    <Icon className="h-7 w-7 text-primary" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-1">
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
