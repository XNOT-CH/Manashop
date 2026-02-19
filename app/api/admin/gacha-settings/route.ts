import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

// GET - Fetch gacha settings
export async function GET() {
    try {
        let settings = await db.gachaSettings.findFirst();

        if (!settings) {
            settings = await db.gachaSettings.create({
                data: {
                    id: "default",
                    isEnabled: true,
                    costType: "CREDIT",
                    costAmount: 0,
                    dailySpinLimit: 999,
                    tierMode: "PRICE",
                },
            });
        }

        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        console.error("Error fetching gacha settings:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการโหลดการตั้งค่ากาชา" },
            { status: 500 }
        );
    }
}

// PUT - Update gacha settings (ADMIN ONLY)
export async function PUT(request: Request) {
    const authCheck = await isAdmin();
    if (!authCheck.success) {
        return NextResponse.json(
            { success: false, message: authCheck.error },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();

        let settings = await db.gachaSettings.findFirst();

        const updateData = {
            isEnabled: body.isEnabled ?? true,
            costType: body.costType ?? "FREE",
            costAmount: body.costAmount ?? 0,
            dailySpinLimit: body.dailySpinLimit ?? 0,
            tierMode: body.tierMode ?? "PRICE",
        };

        if (settings) {
            settings = await db.gachaSettings.update({
                where: { id: settings.id },
                data: updateData,
            });
        } else {
            settings = await db.gachaSettings.create({
                data: { id: "default", ...updateData },
            });
        }

        return NextResponse.json({
            success: true,
            message: "บันทึกการตั้งค่ากาชาสำเร็จ",
            data: settings,
        });
    } catch (error) {
        console.error("Error updating gacha settings:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, message: `เกิดข้อผิดพลาด: ${errorMessage}` },
            { status: 500 }
        );
    }
}
