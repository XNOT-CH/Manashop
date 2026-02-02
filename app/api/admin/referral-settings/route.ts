import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// Keys for referral settings
const REFERRAL_KEYS = [
    "REFERRAL_REWARD_INVITER",
    "REFERRAL_REWARD_INVITEE",
    "REFERRAL_IS_ACTIVE",
    "REFERRAL_MAX_COUNT",
];

// Check if user is admin
async function isAdmin() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return false;

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    return user?.role === "ADMIN";
}

// GET - Fetch referral settings
export async function GET() {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const settings = await db.systemConfig.findMany({
            where: { key: { in: REFERRAL_KEYS } },
        });

        // Build response object with defaults
        const result: Record<string, string | number | boolean> = {
            REFERRAL_REWARD_INVITER: 50,
            REFERRAL_REWARD_INVITEE: 25,
            REFERRAL_IS_ACTIVE: true,
            REFERRAL_MAX_COUNT: 10, // 0 = unlimited
        };

        settings.forEach((s: { key: string; value: string }) => {
            if (s.key === "REFERRAL_IS_ACTIVE") {
                result[s.key] = s.value === "true";
            } else {
                result[s.key] = parseInt(s.value, 10);
                // Handle 0 as valid value for REFERRAL_MAX_COUNT
                if (isNaN(result[s.key] as number)) {
                    result[s.key] = 0;
                }
            }
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching referral settings:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// PUT - Update referral settings
export async function PUT(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { REFERRAL_REWARD_INVITER, REFERRAL_REWARD_INVITEE, REFERRAL_IS_ACTIVE, REFERRAL_MAX_COUNT } = body;

        // Validate inputs
        if (typeof REFERRAL_REWARD_INVITER !== "number" || REFERRAL_REWARD_INVITER < 0) {
            return NextResponse.json(
                { success: false, message: "Invalid inviter reward" },
                { status: 400 }
            );
        }
        if (typeof REFERRAL_REWARD_INVITEE !== "number" || REFERRAL_REWARD_INVITEE < 0) {
            return NextResponse.json(
                { success: false, message: "Invalid invitee reward" },
                { status: 400 }
            );
        }

        // Upsert all settings
        await Promise.all([
            db.systemConfig.upsert({
                where: { key: "REFERRAL_REWARD_INVITER" },
                create: {
                    key: "REFERRAL_REWARD_INVITER",
                    value: String(REFERRAL_REWARD_INVITER),
                    description: "Points rewarded to the inviter",
                },
                update: { value: String(REFERRAL_REWARD_INVITER) },
            }),
            db.systemConfig.upsert({
                where: { key: "REFERRAL_REWARD_INVITEE" },
                create: {
                    key: "REFERRAL_REWARD_INVITEE",
                    value: String(REFERRAL_REWARD_INVITEE),
                    description: "Points rewarded to the new user",
                },
                update: { value: String(REFERRAL_REWARD_INVITEE) },
            }),
            db.systemConfig.upsert({
                where: { key: "REFERRAL_IS_ACTIVE" },
                create: {
                    key: "REFERRAL_IS_ACTIVE",
                    value: String(REFERRAL_IS_ACTIVE),
                    description: "Enable/disable referral system",
                },
                update: { value: String(REFERRAL_IS_ACTIVE) },
            }),
            db.systemConfig.upsert({
                where: { key: "REFERRAL_MAX_COUNT" },
                create: {
                    key: "REFERRAL_MAX_COUNT",
                    value: String(REFERRAL_MAX_COUNT ?? 10),
                    description: "Max referrals per user (0 = unlimited)",
                },
                update: { value: String(REFERRAL_MAX_COUNT ?? 10) },
            }),
        ]);

        return NextResponse.json({
            success: true,
            message: "Settings saved successfully",
        });
    } catch (error) {
        console.error("Error updating referral settings:", error);
        return NextResponse.json(
            { success: false, message: "Failed to save settings" },
            { status: 500 }
        );
    }
}
