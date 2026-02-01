import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - API สาธารณะสำหรับ Footer component
export async function GET() {
    try {
        // ดึง settings
        const settings = await prisma.footerWidgetSettings.findFirst();

        // ถ้าไม่มี settings หรือปิดการแสดงผล ให้ return empty
        if (!settings || !settings.isActive) {
            return NextResponse.json({
                settings: { isActive: false, title: "" },
                links: []
            });
        }

        // ดึงลิงก์ที่ active เท่านั้น
        const links = await prisma.footerLink.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
                id: true,
                label: true,
                href: true,
                openInNewTab: true,
            },
        });

        return NextResponse.json({
            settings: {
                isActive: settings.isActive,
                title: settings.title,
            },
            links
        });
    } catch (error) {
        console.error("Error fetching footer widget:", error);
        return NextResponse.json(
            { settings: { isActive: false, title: "" }, links: [] },
            { status: 500 }
        );
    }
}
