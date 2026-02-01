import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS = {
    id: "default",
    name: "พอยท์",
    symbol: "💎",
    code: "POINT",
    description: null,
    isActive: true,
};

// GET - ดึงการตั้งค่าสกุลเงิน
export async function GET() {
    try {
        let settings = await prisma.currencySettings.findUnique({
            where: { id: "default" },
        });

        // สร้าง default settings ถ้ายังไม่มี
        if (!settings) {
            settings = await prisma.currencySettings.create({
                data: DEFAULT_SETTINGS,
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching currency settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch currency settings" },
            { status: 500 }
        );
    }
}

// PUT - อัพเดทการตั้งค่าสกุลเงิน
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, symbol, description, isActive } = body;

        // Validate required fields
        if (!name || !symbol) {
            return NextResponse.json(
                { error: "Name and symbol are required" },
                { status: 400 }
            );
        }

        const settings = await prisma.currencySettings.upsert({
            where: { id: "default" },
            update: {
                name,
                symbol,
                description: description || null,
                isActive: isActive ?? true,
            },
            create: {
                id: "default",
                name,
                symbol,
                code: "POINT",
                description: description || null,
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error updating currency settings:", error);
        return NextResponse.json(
            { error: "Failed to update currency settings" },
            { status: 500 }
        );
    }
}
