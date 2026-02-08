import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cacheOrFetch, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

// GET - ดึง popup ที่ active (สำหรับ frontend)
export async function GET() {
    try {
        const popups = await cacheOrFetch(
            CACHE_KEYS.ANNOUNCEMENT_POPUPS,
            async () => {
                return db.announcementPopup.findMany({
                    where: { isActive: true },
                    orderBy: [
                        { sortOrder: "asc" },
                        { createdAt: "desc" },
                    ],
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                        linkUrl: true,
                        dismissOption: true,
                    },
                });
            },
            CACHE_TTL.MEDIUM
        );

        return NextResponse.json(popups);
    } catch (error) {
        console.error("Error fetching popups:", error);
        return NextResponse.json(
            { error: "Failed to fetch popups" },
            { status: 500 }
        );
    }
}
