import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - ดึงรายการลิงก์ทั้งหมด + settings
export async function GET() {
    try {
        // ดึง settings (สร้างใหม่ถ้ายังไม่มี)
        let settings = await prisma.footerWidgetSettings.findFirst();
        if (!settings) {
            settings = await prisma.footerWidgetSettings.create({
                data: {
                    isActive: true,
                    title: "เมนูลัด",
                },
            });
        }

        // ดึงลิงก์ทั้งหมด
        const links = await prisma.footerLink.findMany({
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json({ settings, links });
    } catch (error) {
        console.error("Error fetching footer links:", error);
        return NextResponse.json(
            { error: "Failed to fetch footer links" },
            { status: 500 }
        );
    }
}

// POST - เพิ่มลิงก์ใหม่
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { label, href, openInNewTab = false } = body;

        if (!label || !href) {
            return NextResponse.json(
                { error: "Label and href are required" },
                { status: 400 }
            );
        }

        // หา sortOrder สูงสุด
        const maxSortOrder = await prisma.footerLink.aggregate({
            _max: { sortOrder: true },
        });
        const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

        const link = await prisma.footerLink.create({
            data: {
                label,
                href,
                openInNewTab,
                sortOrder: nextSortOrder,
            },
        });

        return NextResponse.json(link, { status: 201 });
    } catch (error) {
        console.error("Error creating footer link:", error);
        return NextResponse.json(
            { error: "Failed to create footer link" },
            { status: 500 }
        );
    }
}
