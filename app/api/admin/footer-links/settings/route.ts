import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - ดึง widget settings
export async function GET() {
    try {
        let settings = await prisma.footerWidgetSettings.findFirst();
        if (!settings) {
            settings = await prisma.footerWidgetSettings.create({
                data: {
                    isActive: true,
                    title: "เมนูลัด",
                },
            });
        }
        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching footer settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch footer settings" },
            { status: 500 }
        );
    }
}

// PUT - อัปเดต widget settings
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { isActive, title } = body;

        let settings = await prisma.footerWidgetSettings.findFirst();

        if (!settings) {
            settings = await prisma.footerWidgetSettings.create({
                data: {
                    isActive: isActive ?? true,
                    title: title ?? "เมนูลัด",
                },
            });
        } else {
            settings = await prisma.footerWidgetSettings.update({
                where: { id: settings.id },
                data: {
                    ...(isActive !== undefined && { isActive }),
                    ...(title !== undefined && { title }),
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error updating footer settings:", error);
        return NextResponse.json(
            { error: "Failed to update footer settings" },
            { status: 500 }
        );
    }
}
