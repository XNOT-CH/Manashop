import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// Default tier configuration
const DEFAULT_TIER_CONFIG = {
    tiers: {
        bronze: { min: 500, max: 999, name: "Bronze", color: "#CD7F32", icon: "🥉" },
        silver: { min: 1000, max: 4999, name: "Silver", color: "#C0C0C0", icon: "🥈" },
        gold: { min: 5000, max: 49999, name: "Gold", color: "#FFD700", icon: "👑" },
        diamond: { min: 50000, max: 199999, name: "Diamond", color: "#4FC3F7", icon: "💎" },
        legend: { min: 200000, name: "Legend", color: "#9C27B0", icon: "👑" },
    },
    borders: {
        gold: 5000,
        platinum: 20000,
    },
};

// GET /api/admin/settings/tiers - Get tier configuration
export async function GET() {
    try {
        // Check authentication
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;

        if (!userId) {
            return NextResponse.json(
                { error: "ไม่ได้เข้าสู่ระบบ" },
                { status: 401 }
            );
        }

        // Check if user is admin
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "ไม่มีสิทธิ์เข้าถึง" },
                { status: 403 }
            );
        }

        // Fetch tier configuration from settings
        const setting = await db.systemConfig.findUnique({
            where: { key: "tier_config" },
        });

        if (!setting) {
            // Return default config if not found
            return NextResponse.json(DEFAULT_TIER_CONFIG);
        }

        // Parse JSON value
        const config = typeof setting.value === "string"
            ? JSON.parse(setting.value)
            : setting.value;

        return NextResponse.json(config);
    } catch (error) {
        console.error("Error fetching tier config:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
            { status: 500 }
        );
    }
}

// PUT /api/admin/settings/tiers - Update tier configuration
export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId")?.value;

        if (!userId) {
            return NextResponse.json(
                { error: "ไม่ได้เข้าสู่ระบบ" },
                { status: 401 }
            );
        }

        // Check if user is admin
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "ไม่มีสิทธิ์เข้าถึง" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { tiers, borders } = body;

        // Validate tiers
        if (!tiers || !borders) {
            return NextResponse.json(
                { error: "ข้อมูลไม่ครบถ้วน" },
                { status: 400 }
            );
        }

        // Validate tier ranges don't overlap
        const tierArray = [
            { name: "bronze", ...tiers.bronze },
            { name: "silver", ...tiers.silver },
            { name: "gold", ...tiers.gold },
            { name: "diamond", ...tiers.diamond },
        ];

        for (let i = 0; i < tierArray.length - 1; i++) {
            if (tierArray[i].max >= tierArray[i + 1].min) {
                return NextResponse.json(
                    { error: `ช่วงเงินของ ${tierArray[i].name} และ ${tierArray[i + 1].name} ซ้อนทับกัน` },
                    { status: 400 }
                );
            }
        }

        const config = { tiers, borders };

        // Upsert tier configuration
        await db.systemConfig.upsert({
            where: { key: "tier_config" },
            update: { value: JSON.stringify(config) },
            create: {
                key: "tier_config",
                value: JSON.stringify(config),
            },
        });

        return NextResponse.json({ success: true, config });
    } catch (error) {
        console.error("Error updating tier config:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
            { status: 500 }
        );
    }
}
