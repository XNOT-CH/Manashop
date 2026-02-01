import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Default nav items to seed if database is empty
const DEFAULT_NAV_ITEMS = [
    { label: "หน้าแรก", href: "/", icon: "home", sortOrder: 0 },
    { label: "ร้านค้า", href: "/shop", icon: "shop", sortOrder: 1 },
    { label: "แดชบอร์ด", href: "/dashboard", icon: "dashboard", sortOrder: 2 },
    { label: "ช่วยเหลือ", href: "/help", icon: "help", sortOrder: 3 },
];

// GET - ดึงรายการเมนูทั้งหมด (สร้าง default ถ้ายังไม่มี)
export async function GET() {
    try {
        // ตรวจสอบว่ามีข้อมูลหรือยัง
        const count = await prisma.navItem.count();

        // ถ้ายังไม่มี ให้สร้าง default items
        if (count === 0) {
            await prisma.navItem.createMany({
                data: DEFAULT_NAV_ITEMS,
            });
        }

        const items = await prisma.navItem.findMany({
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error fetching nav items:", error);
        return NextResponse.json(
            { error: "Failed to fetch nav items" },
            { status: 500 }
        );
    }
}

// POST - เพิ่มเมนูใหม่
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { label, href, icon } = body;

        if (!label || !href) {
            return NextResponse.json(
                { error: "Label and href are required" },
                { status: 400 }
            );
        }

        // หา sortOrder สูงสุด
        const maxSortOrder = await prisma.navItem.aggregate({
            _max: { sortOrder: true },
        });
        const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

        const item = await prisma.navItem.create({
            data: {
                label,
                href,
                icon: icon || null,
                sortOrder: nextSortOrder,
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error("Error creating nav item:", error);
        return NextResponse.json(
            { error: "Failed to create nav item" },
            { status: 500 }
        );
    }
}
