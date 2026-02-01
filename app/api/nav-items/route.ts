import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - ดึงรายการเมนูที่ active (สำหรับ Navbar)
export async function GET() {
    try {
        const items = await prisma.navItem.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
                id: true,
                label: true,
                href: true,
                icon: true,
            },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error fetching active nav items:", error);
        return NextResponse.json(
            { error: "Failed to fetch nav items" },
            { status: 500 }
        );
    }
}
