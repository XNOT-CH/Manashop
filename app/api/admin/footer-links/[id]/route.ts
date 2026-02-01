import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - แก้ไขลิงก์
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { label, href, openInNewTab, sortOrder, isActive } = body;

        const link = await prisma.footerLink.update({
            where: { id },
            data: {
                ...(label !== undefined && { label }),
                ...(href !== undefined && { href }),
                ...(openInNewTab !== undefined && { openInNewTab }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(link);
    } catch (error) {
        console.error("Error updating footer link:", error);
        return NextResponse.json(
            { error: "Failed to update footer link" },
            { status: 500 }
        );
    }
}

// DELETE - ลบลิงก์
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.footerLink.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting footer link:", error);
        return NextResponse.json(
            { error: "Failed to delete footer link" },
            { status: 500 }
        );
    }
}
