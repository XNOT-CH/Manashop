import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRegisterRateLimit, getClientIp } from "@/lib/rateLimit";
import { nanoid } from "nanoid";

// Generate unique 8-char referral code
async function generateReferralCode(): Promise<string> {
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
        code = nanoid(8).toUpperCase();
        const existing = await db.user.findUnique({
            where: { referralCode: code },
        });
        if (!existing) return code;
        attempts++;
    } while (attempts < maxAttempts);

    // Fallback: use longer code
    return nanoid(12).toUpperCase();
}

// Get referral system settings
async function getReferralSettings() {
    const settings = await db.systemConfig.findMany({
        where: {
            key: {
                in: ["REFERRAL_REWARD_INVITER", "REFERRAL_REWARD_INVITEE", "REFERRAL_IS_ACTIVE", "REFERRAL_MAX_COUNT"],
            },
        },
    });

    const result = {
        isActive: true,
        inviterReward: 50,
        inviteeReward: 25,
        maxCount: 10, // 0 = unlimited
    };

    settings.forEach((s: { key: string; value: string }) => {
        if (s.key === "REFERRAL_IS_ACTIVE") {
            result.isActive = s.value === "true";
        } else if (s.key === "REFERRAL_REWARD_INVITER") {
            result.inviterReward = parseInt(s.value, 10) || 0;
        } else if (s.key === "REFERRAL_REWARD_INVITEE") {
            result.inviteeReward = parseInt(s.value, 10) || 0;
        } else if (s.key === "REFERRAL_MAX_COUNT") {
            result.maxCount = parseInt(s.value, 10);
            if (isNaN(result.maxCount)) result.maxCount = 10;
        }
    });

    return result;
}

export async function POST(request: NextRequest) {
    try {
        // Check rate limit first
        const clientIp = getClientIp(request);
        const rateLimit = checkRegisterRateLimit(clientIp);

        if (rateLimit.blocked) {
            return NextResponse.json(
                { success: false, message: rateLimit.message },
                { status: 429 }
            );
        }

        const { username, password, ref } = await request.json();

        // Validate inputs
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
                { status: 400 }
            );
        }

        if (username.length < 3) {
            return NextResponse.json(
                { success: false, message: "Username must be at least 3 characters" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await db.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Username already taken" },
                { status: 400 }
            );
        }

        // Anti-abuse: Check if IP already registered an account
        if (clientIp && clientIp !== "unknown") {
            const existingIpUser = await db.user.findFirst({
                where: { registrationIp: clientIp },
            });

            if (existingIpUser) {
                return NextResponse.json(
                    { success: false, message: "ไม่สามารถสมัครได้ เนื่องจาก IP นี้มีบัญชีอยู่แล้ว" },
                    { status: 403 }
                );
            }
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate unique referral code for this user
        const referralCode = await generateReferralCode();

        // Handle referral logic
        let referredById: string | undefined;
        let inviterReward = 0;
        let inviteeReward = 0;

        if (ref) {
            const referralSettings = await getReferralSettings();

            if (referralSettings.isActive) {
                // Find the inviter by their referral code
                const inviter = await db.user.findUnique({
                    where: { referralCode: ref },
                });

                if (inviter) {
                    referredById = inviter.id;
                    inviteeReward = referralSettings.inviteeReward;

                    // Check if inviter has reached max referral limit
                    if (referralSettings.maxCount > 0) {
                        const referralCount = await db.user.count({
                            where: { referredById: inviter.id },
                        });

                        if (referralCount < referralSettings.maxCount) {
                            inviterReward = referralSettings.inviterReward;
                        }
                        // If limit reached, inviterReward stays 0
                    } else {
                        // No limit (maxCount = 0)
                        inviterReward = referralSettings.inviterReward;
                    }
                }
            }
        }

        // Create user with referral data and registration IP
        const user = await db.user.create({
            data: {
                username,
                password: hashedPassword,
                role: "USER",
                creditBalance: 100, // Welcome bonus
                pointBalance: inviteeReward, // Referral bonus for new user
                referralCode,
                referredById,
                registrationIp: clientIp !== "unknown" ? clientIp : null,
            },
        });

        // If referrer exists, reward them
        if (referredById && inviterReward > 0) {
            await db.user.update({
                where: { id: referredById },
                data: {
                    pointBalance: { increment: inviterReward },
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: referredById
                ? `สมัครสมาชิกสำเร็จ! คุณได้รับ ${inviteeReward} พอยท์จากการสมัครด้วยลิงก์เชิญ`
                : "Account created successfully! You can now login.",
            userId: user.id,
        });
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Registration failed",
            },
            { status: 500 }
        );
    }
}
