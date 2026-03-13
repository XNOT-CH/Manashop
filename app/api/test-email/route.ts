import { sendEmail } from "@/lib/mail";
import { NotificationEmail } from "@/components/emails/NotificationEmail";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const to = searchParams.get("to");

        if (!to) {
            return NextResponse.json(
                { error: "Please provide a 'to' email address in the query parameters." },
                { status: 400 }
            );
        }

        const { success, error, data } = await sendEmail({
            to,
            subject: "ทดสอบระบบอีเมลจาก SnailShop 🐌",
            react: NotificationEmail({
                title: "ยินดีต้อนรับสู่ SnailShop",
                message: "นี่คืออีเมลทดสอบระบบการส่งแจ้งเตือนผ่าน Resend หากคุณได้รับอีเมลฉบับนี้ แปลว่าระบบทำงานได้สมบูรณ์ครับ!",
            }),
        });

        if (!success) {
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: unknown) {
        console.error("[TEST_EMAIL]", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
