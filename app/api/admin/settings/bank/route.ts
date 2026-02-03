import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

// Default bank settings
const DEFAULT_BANK_SETTINGS = {
    bankName: "ธนาคารกสิกรไทย",
    accountName: "บจก. เกมสโตร์",
    accountNumber: "123-4-56789-0",
    isActive: true,
};

// GET: Fetch bank settings
export async function GET() {
    try {
        const config = await db.systemConfig.findUnique({
            where: { key: "bank_settings" },
        });

        if (config) {
            return NextResponse.json({
                success: true,
                settings: JSON.parse(config.value),
            });
        }

        // Return defaults if not set
        return NextResponse.json({
            success: true,
            settings: DEFAULT_BANK_SETTINGS,
        });
    } catch (error) {
        console.error("Error fetching bank settings:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}

// PUT: Update bank settings
export async function PUT(request: Request) {
    // Check if user is admin
    const authCheck = await isAdmin();
    if (!authCheck.success) {
        return NextResponse.json(
            { success: false, message: authCheck.error },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { bankName, accountName, accountNumber, isActive } = body;

        // Validate required fields
        if (!bankName || !accountName || !accountNumber) {
            return NextResponse.json(
                { success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                { status: 400 }
            );
        }

        const settings = {
            bankName,
            accountName,
            accountNumber,
            isActive: isActive ?? true,
        };

        // Upsert the config
        await db.systemConfig.upsert({
            where: { key: "bank_settings" },
            update: {
                value: JSON.stringify(settings),
            },
            create: {
                key: "bank_settings",
                value: JSON.stringify(settings),
                description: "Bank account settings for top-up feature",
            },
        });

        return NextResponse.json({
            success: true,
            message: "บันทึกการตั้งค่าสำเร็จ",
            settings,
        });
    } catch (error) {
        console.error("Error updating bank settings:", error);
        return NextResponse.json(
            { success: false, message: "ไม่สามารถบันทึกการตั้งค่าได้" },
            { status: 500 }
        );
    }
}
