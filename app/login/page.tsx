// Server Component — fetch logo จาก DB โดยตรง ไม่ต้อง client-side fetch
import { db } from "@/lib/db";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
    const settings = await db.siteSettings.findFirst({
        select: { logoUrl: true },
    });

    return <LoginForm logoUrl={settings?.logoUrl ?? null} />;
}
