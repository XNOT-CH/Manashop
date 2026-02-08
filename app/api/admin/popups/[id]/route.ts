"use server";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invalidatePopupCaches } from "@/lib/cache";
import { auditFromRequest, AUDIT_ACTIONS } from "@/lib/auditLog";

// GET - ดึง popup ตาม ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const popup = await db.announcementPopup.findUnique({
            where: { id },
        });

        if (!popup) {
            return NextResponse.json(
                { error: "Popup not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(popup);
    } catch (error) {
        console.error("Error fetching popup:", error);
        return NextResponse.json(
            { error: "Failed to fetch popup" },
            { status: 500 }
        );
    }
}

// PUT - แก้ไข popup
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, imageUrl, linkUrl, sortOrder, isActive, dismissOption } = body;

        if (!imageUrl) {
            return NextResponse.json(
                { error: "Image URL is required" },
                { status: 400 }
            );
        }

        const popup = await db.announcementPopup.update({
            where: { id },
            data: {
                title: title || null,
                imageUrl,
                linkUrl: linkUrl || null,
                sortOrder: sortOrder !== undefined ? sortOrder : 0,
                isActive: isActive !== undefined ? isActive : true,
                dismissOption: dismissOption || "show_always",
            },
        });

        // Invalidate cache
        await invalidatePopupCaches();

        // Audit log
        await auditFromRequest(request, {
            action: AUDIT_ACTIONS.POPUP_UPDATE,
            resource: "AnnouncementPopup",
            resourceId: popup.id,
            details: { title: title || "Untitled" },
        });

        return NextResponse.json(popup);
    } catch (error) {
        console.error("Error updating popup:", error);
        return NextResponse.json(
            { error: "Failed to update popup" },
            { status: 500 }
        );
    }
}

// DELETE - ลบ popup
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const popup = await db.announcementPopup.findUnique({
            where: { id },
        });

        if (!popup) {
            return NextResponse.json(
                { error: "Popup not found" },
                { status: 404 }
            );
        }

        await db.announcementPopup.delete({
            where: { id },
        });

        // Invalidate cache
        await invalidatePopupCaches();

        // Audit log
        await auditFromRequest(request, {
            action: AUDIT_ACTIONS.POPUP_DELETE,
            resource: "AnnouncementPopup",
            resourceId: id,
            details: { title: popup.title || "Untitled" },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting popup:", error);
        return NextResponse.json(
            { error: "Failed to delete popup" },
            { status: 500 }
        );
    }
}
