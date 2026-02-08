"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

// Dynamic import with no SSR to ensure client-side only rendering
const AnnouncementPopup = dynamic(
    () => import("@/components/AnnouncementPopup"),
    { ssr: false }
);

export function AnnouncementPopupWrapper() {
    useEffect(() => {
        console.log("[PopupWrapper] Mounted successfully");
    }, []);

    console.log("[PopupWrapper] Rendering...");
    return <AnnouncementPopup />;
}

