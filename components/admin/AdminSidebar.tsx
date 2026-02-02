"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Users,
    FileCheck,
    Settings,
    LogOut,
    Gamepad2,
    Newspaper,
    FileText,
    LinkIcon,
    Gem,
    UserPlus,
    LayoutGrid,
} from "lucide-react";

const sidebarLinks = [
    { href: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard },
    { href: "/admin/products", label: "จัดการสินค้า", icon: Package },
    { href: "/admin/category-banners", label: "จัดการแบนเนอร์", icon: LayoutGrid },
    { href: "/admin/news", label: "จัดการข่าวสาร", icon: Newspaper },
    { href: "/admin/users", label: "จัดการผู้ใช้", icon: Users },
    { href: "/admin/slips", label: "ตรวจสอบสลิป", icon: FileCheck },
    { href: "/admin/referral", label: "ระบบแนะนำเพื่อน", icon: UserPlus },
    { href: "/admin/currency-settings", label: "ตั้งค่าสกุลเงิน", icon: Gem },
    { href: "/admin/footer-links", label: "ลิงก์ท้ายเว็บ", icon: LinkIcon },
    { href: "/admin/audit-logs", label: "บันทึกการใช้งาน", icon: FileText },
    { href: "/admin/settings", label: "ตั้งค่าเว็บไซต์", icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-slate-900 text-white">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <Gamepad2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg font-bold">แผงควบคุมแอดมิน</span>
                </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {sidebarLinks.map((link) => {
                    const isActive = pathname === link.href ||
                        (link.href !== "/admin" && pathname.startsWith(link.href));
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                ? "bg-primary text-white"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Back to Shop */}
            <div className="border-t border-slate-800 p-3">
                <Link
                    href="/"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                >
                    <LogOut className="h-5 w-5" />
                    กลับไปหน้าร้าน
                </Link>
            </div>
        </aside>
    );
}
