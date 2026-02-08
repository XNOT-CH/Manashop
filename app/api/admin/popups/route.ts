"use server";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invalidatePopupCaches } from "@/lib/cache";
import { auditFromRequest, AUDIT_ACTIONS } from "@/lib/auditLog";

// GET - ดึง popup ทั้งหมด
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("active") === "true";

        const popups = await db.announcementPopup.findMany({
            where: activeOnly ? { isActive: true } : undefined,
            orderBy: [
                { sortOrder: "asc" },
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json(popups);
    } catch (error) {
        console.error("Error fetching popups:", error);
        return NextResponse.json(
            { error: "Failed to fetch popups" },
            { status: 500 }
        );
    }
}

// POST - สร้าง popup ใหม่
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, imageUrl, linkUrl, sortOrder, isActive, dismissOption } = body;

        if (!imageUrl) {
            return NextResponse.json(
                { error: "Image URL is required" },
                { status: 400 }
            );
        }

        const popup = await db.announcementPopup.create({
            data: {
                title: title || null,
                imageUrl,
                linkUrl: linkUrl || null,
                sortOrder: sortOrder || 0,
                isActive: isActive !== undefined ? isActive : true,
                dismissOption: dismissOption || "show_always",
            },
        });

        // Invalidate cache
        await invalidatePopupCaches();

        // Audit log
        await auditFromRequest(request, {
            action: AUDIT_ACTIONS.POPUP_CREATE,
            resource: "AnnouncementPopup",
            resourceId: popup.id,
            details: { title: title || "Untitled" },
        });

        return NextResponse.json(popup, { status: 201 });
    } catch (error) {
        console.error("Error creating popup:", error);
        return NextResponse.json(
            { error: "Failed to create popup" },
            { status: 500 }
        );
    }
}
