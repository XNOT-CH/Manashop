import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditFromRequest, AUDIT_ACTIONS } from "@/lib/auditLog";

// GET - ดึงแบนเนอร์ตาม ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const banner = await db.categoryBanner.findUnique({
            where: { id },
        });

        if (!banner) {
            return NextResponse.json(
                { error: "Banner not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(banner);
    } catch (error) {
        console.error("Error fetching category banner:", error);
        return NextResponse.json(
            { error: "Failed to fetch category banner" },
            { status: 500 }
        );
    }
}

// PUT - อัปเดตแบนเนอร์
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const banner = await db.categoryBanner.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
                ...(minPrice !== undefined && { minPrice: minPrice ? parseFloat(minPrice) : null }),
                ...(maxPrice !== undefined && { maxPrice: maxPrice ? parseFloat(maxPrice) : null }),
                ...(productCount !== undefined && { productCount }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive }),
                ...(showOnHome !== undefined && { showOnHome }),
                ...(showOnProducts !== undefined && { showOnProducts }),
            },
        });

        // Audit log
        await auditFromRequest(request, {
            action: AUDIT_ACTIONS.SETTINGS_UPDATE || "BANNER_UPDATE",
            resource: "CategoryBanner",
            resourceId: banner.id,
            details: { name: banner.name },
        });

        return NextResponse.json(banner);
    } catch (error) {
        console.error("Error updating category banner:", error);
        return NextResponse.json(
            { error: "Failed to update category banner" },
            { status: 500 }
        );
    }
}

// DELETE - ลบแบนเนอร์
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const banner = await db.categoryBanner.findUnique({
            where: { id },
        });

        if (!banner) {
            return NextResponse.json(
                { error: "Banner not found" },
                { status: 404 }
            );
        }

        await db.categoryBanner.delete({
            where: { id },
        });

        // Audit log
        await auditFromRequest(request, {
            action: AUDIT_ACTIONS.SETTINGS_UPDATE || "BANNER_DELETE",
            resource: "CategoryBanner",
            resourceId: id,
            details: { name: banner.name },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting category banner:", error);
        return NextResponse.json(
            { error: "Failed to delete category banner" },
            { status: 500 }
        );
    }
}
