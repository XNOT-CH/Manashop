import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditFromRequest, AUDIT_ACTIONS } from "@/lib/auditLog";

// GET - ดึงแบนเนอร์ทั้งหมด
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = searchParams.get("page"); // home, products, หรือ null = ทั้งหมด
        const activeOnly = searchParams.get("active") === "true";

        let where: Record<string, boolean | undefined> = {};

        if (activeOnly) {
            where.isActive = true;
        }

        if (page === "home") {
            where.showOnHome = true;
        } else if (page === "products") {
            where.showOnProducts = true;
        }

        const banners = await db.categoryBanner.findMany({
            where: Object.keys(where).length > 0 ? where : undefined,
            orderBy: [
                { sortOrder: "asc" },
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json(banners);
    } catch (error) {
        console.error("Error fetching category banners:", error);
        return NextResponse.json(
            { error: "Failed to fetch category banners" },
            { status: 500 }
        );
    }
}

// POST - สร้างแบนเนอร์ใหม่
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            imageUrl,
            linkUrl,
            minPrice,
            maxPrice,
            productCount,
            sortOrder,
            isActive,
            showOnHome,
            showOnProducts
        } = body;

        if (!name || !imageUrl) {
            return NextResponse.json(
                { error: "Name and imageUrl are required" },
                { status: 400 }
            );
        }

        const banner = await db.categoryBanner.create({
            data: {
                name,
                imageUrl,
                linkUrl: linkUrl || null,
                minPrice: minPrice ? parseFloat(minPrice) : null,
                maxPrice: maxPrice ? parseFloat(maxPrice) : null,
                productCount: productCount || 0,
                sortOrder: sortOrder || 0,
                isActive: isActive !== undefined ? isActive : true,
                showOnHome: showOnHome !== undefined ? showOnHome : true,
                showOnProducts: showOnProducts !== undefined ? showOnProducts : false,
            },
        });

        // Audit log
        await auditFromRequest(request, {
            action: AUDIT_ACTIONS.SETTINGS_UPDATE || "BANNER_CREATE",
            resource: "CategoryBanner",
            resourceId: banner.id,
            details: { name },
        });

        return NextResponse.json(banner, { status: 201 });
    } catch (error) {
        console.error("Error creating category banner:", error);
        return NextResponse.json(
            { error: "Failed to create category banner" },
            { status: 500 }
        );
    }
}
