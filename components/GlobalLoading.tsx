"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GameLoadingScreen } from "./GameLoadingScreen";

export function GlobalLoading() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // When path or search params change, we assume navigation is complete
        const timer = setTimeout(() => setIsLoading(false), 0);
        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    // We use a small hack to detect when a link is clicked to show loading.
    // Next.js app router doesn't have a built-in router.events router event system like pages router.
    useEffect(() => {
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a");

            if (!anchor) return;

            const href = anchor.getAttribute("href");
            const targetAttr = anchor.getAttribute("target");

            // Ignore external links, links opening in new tabs, or anchor links on the same page
            if (
                !href ||
                href.startsWith("http") ||
                href.startsWith("mailto") ||
                href.startsWith("tel") ||
                targetAttr === "_blank" ||
                href.startsWith("#")
            ) {
                return;
            }

            // Only show loading if we are actually navigating to a new path
            if (href !== pathname && !href.startsWith(`${pathname}?`)) {
                setIsLoading(true);
            }
        };

        // Use capture phase to ensure we catch the click before default behavior
        document.addEventListener("click", handleAnchorClick, true);

        return () => {
            document.removeEventListener("click", handleAnchorClick, true);
        };
    }, [pathname]);

    // Adding a fallback timeout in case navigation gets stuck or is very fast but doesn't trigger effect
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (isLoading) {
            // Force hide loading after 3 seconds max as a safety net
            timeoutId = setTimeout(() => {
                setIsLoading(false);
            }, 3000);
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isLoading]);

    if (!isLoading) return null;

    return <GameLoadingScreen />;
}
