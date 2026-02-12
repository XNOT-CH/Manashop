"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
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
    Megaphone,
    Shield,
    Menu,
} from "lucide-react";

const sidebarLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Product Manager", icon: Package },
    { href: "/admin/news", label: "News Manager", icon: Newspaper },
    { href: "/admin/popups", label: "Pop-up Manager", icon: Megaphone },
    { href: "/admin/users", label: "User Manager", icon: Users },
    { href: "/admin/roles", label: "Role Manager", icon: Shield },
    { href: "/admin/slips", label: "Slip Verification", icon: FileCheck },
    { href: "/admin/currency-settings", label: "Currency Settings", icon: Gem },
    { href: "/admin/footer-links", label: "Footer Links", icon: LinkIcon },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
    { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
    const pathname = usePathname();

    return (
        <>
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {sidebarLinks.map((link) => {
                    const isActive = pathname === link.href ||
                        (link.href !== "/admin" && pathname.startsWith(link.href));
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onLinkClick}
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
                    onClick={onLinkClick}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                >
                    <LogOut className="h-5 w-5" />
                    Back to Shop
                </Link>
            </div>
        </>
    );
}

export function AdminSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-64 flex-col bg-slate-900 text-white">
                {/* Logo */}
                <div className="flex h-16 items-center border-b border-slate-800 px-6">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <Gamepad2 className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold">Admin Panel</span>
                    </Link>
                </div>

                <SidebarNav />
            </aside>

            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 z-40 flex md:hidden h-14 items-center justify-between bg-slate-900 text-white px-4 border-b border-slate-800">
                <Link href="/admin" className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                        <Gamepad2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-base font-bold">Admin</span>
                </Link>

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-slate-800">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0 bg-slate-900 text-white border-slate-800">
                        <div className="flex h-14 items-center border-b border-slate-800 px-6">
                            <span className="text-lg font-bold">Admin Panel</span>
                        </div>
                        <div className="flex flex-col h-[calc(100%-3.5rem)]">
                            <SidebarNav onLinkClick={() => setOpen(false)} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
