"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
    const handleLogout = async () => {
        await signOut({ callbackUrl: "/" });
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
        </Button>
    );
}
