import Link from "next/link";
import { getSiteSettings } from "@/lib/getSiteSettings";
import { prisma } from "@/lib/prisma";
import {
    Gamepad2,
    Home,
    ShoppingBag,
    LayoutDashboard,
    Wallet,
    ExternalLink,
    ShoppingCart,
    Receipt,
    History,
    CreditCard
} from "lucide-react";

// ดึงข้อมูล Footer Widget จากฐานข้อมูล
async function getFooterWidget() {
    try {
        const settings = await prisma.footerWidgetSettings.findFirst();
        if (!settings || !settings.isActive) {
            return { settings: null, links: [] };
        }

        const links = await prisma.footerLink.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
        });

        return { settings, links };
    } catch {
        return { settings: null, links: [] };
    }
}

export default async function Footer() {
    // Use cached site settings
    const siteSettings = await getSiteSettings();
    const footerWidget = await getFooterWidget();

    const currentYear = new Date().getFullYear();

    // เมนูหลัก
    const menuLinks = [
        { href: "/", label: "หน้าหลัก", icon: Home },
        { href: "/shop", label: "สินค้าทั่วไป", icon: ShoppingBag },
        { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
        { href: "/dashboard/topup", label: "เติมเงิน", icon: Wallet },
    ];

    // ประวัติต่างๆ
    const historyLinks = [
        { href: "/dashboard/orders", label: "ประวัติการสั่งซื้อ", icon: ShoppingCart },
        { href: "/dashboard/purchases", label: "ประวัติการซื้อสินค้า", icon: Receipt },
        { href: "/dashboard/transactions", label: "ประวัติการเติมเงิน", icon: CreditCard },
        { href: "/dashboard/history", label: "ประวัติทั้งหมด", icon: History },
    ];

    return (
        <footer className="bg-gradient-to-b from-card/80 via-card to-primary/10 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

                    {/* Logo & Description */}
                    <div className="text-center md:text-left flex flex-col items-center md:items-start">
                        <Link href="/" className="inline-block mb-4 group">
                            <div className="relative">
                                {siteSettings?.logoUrl ? (
                                    <img
                                        src={siteSettings.logoUrl}
                                        alt="Logo"
                                        className="h-28 w-28 rounded-2xl object-contain shadow-2xl ring-4 ring-primary/30 transition-all duration-300 group-hover:ring-primary/50 group-hover:shadow-primary/30 animate-float"
                                    />
                                ) : (
                                    <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-2xl ring-4 ring-primary/30 animate-float">
                                        <Gamepad2 className="h-14 w-14 text-white drop-shadow-lg" />
                                    </div>
                                )}
                                {/* Glow effect */}
                                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10 animate-pulse"></div>
                            </div>
                        </Link>
                        <h3 className="font-extrabold text-primary text-2xl mb-2 tracking-tight">
                            {siteSettings?.heroTitle || "GameStore"}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
                            {siteSettings?.heroDescription || "แหล่งซื้อขายไอดีเกมที่ปลอดภัยที่สุด"}
                        </p>
                    </div>

                    {/* เมนูหลัก */}
                    <div>
                        <h4 className="font-bold text-primary text-lg mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-primary rounded-full"></span>
                            เมนูหลัก
                        </h4>
                        <ul className="space-y-3">
                            {menuLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 group"
                                        >
                                            <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                            {link.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* ประวัติต่างๆ / Footer Widget */}
                    <div>
                        {footerWidget.settings && footerWidget.links.length > 0 ? (
                            <>
                                <h4 className="font-bold text-primary text-lg mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-primary rounded-full"></span>
                                    {footerWidget.settings.title}
                                </h4>
                                <ul className="space-y-3">
                                    {footerWidget.links.map((link) => (
                                        <li key={link.id}>
                                            {link.openInNewTab ? (
                                                <a
                                                    href={link.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 group"
                                                >
                                                    <ExternalLink className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                                    {link.label}
                                                </a>
                                            ) : (
                                                <Link
                                                    href={link.href}
                                                    className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 group"
                                                >
                                                    <Receipt className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                                    {link.label}
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <>
                                <h4 className="font-bold text-primary text-lg mb-4 flex items-center gap-2">
                                    <span className="w-1 h-5 bg-primary rounded-full"></span>
                                    ประวัติต่างๆ
                                </h4>
                                <ul className="space-y-3">
                                    {historyLinks.map((link) => {
                                        const Icon = link.icon;
                                        return (
                                            <li key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 group"
                                                >
                                                    <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                                    {link.label}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </>
                        )}
                    </div>

                    {/* ติดต่อเรา - Facebook Widget */}
                    <div>
                        <h4 className="font-bold text-primary text-lg mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-primary rounded-full"></span>
                            ติดต่อเรา
                        </h4>
                        <div className="space-y-3">
                            {/* Facebook Page Plugin - SNAILSHOP */}
                            <div className="rounded-xl overflow-hidden shadow-lg border border-primary/20 bg-white">
                                <iframe
                                    src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61571169820803&tabs=timeline&width=280&height=250&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true"
                                    width="100%"
                                    height="250"
                                    style={{ border: "none", overflow: "hidden" }}
                                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                    title="SNAILSHOP Facebook Page"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-10 pt-6 border-t border-primary/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} {siteSettings?.heroTitle || "GameStore"}. All rights reserved.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            <span className="text-primary font-medium">{siteSettings?.heroTitle || "GameStore"}</span>
                            {" "}| ติดต่อเจ้าของร้านได้ที่ Facebook
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
