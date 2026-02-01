import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - แก้ไขเมนู
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { label, href, icon, isActive, sortOrder } = body;

        const item = await prisma.navItem.update({
            where: { id },
            data: {
                ...(label !== undefined && { label }),
                ...(href !== undefined && { href }),
                ...(icon !== undefined && { icon }),
                ...(isActive !== undefined && { isActive }),
                ...(sortOrder !== undefined && { sortOrder }),
            },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error updating nav item:", error);
        return NextResponse.json(
            { error: "Failed to update nav item" },
            { status: 500 }
        );
    }
}

// DELETE - ลบเมนู
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.navItem.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting nav item:", error);
        return NextResponse.json(
            { error: "Failed to delete nav item" },
            { status: 500 }
        );
    }
}
