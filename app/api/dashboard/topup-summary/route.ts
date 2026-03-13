import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// ─── Bank Color Map ─────────────────────────────────────
const BANK_COLORS: Record<string, string> = {
    KBANK: "#00A651",
    SCB: "#4E2A84",
    KTB: "#1BA5E0",
    BBL: "#1E3A8A",
    BAY: "#FFC107",
    TMB: "#004EC4",
    TTB: "#FC4F1F",
    GSB: "#E91E8B",
    TRUEWALLET: "#FF6600",
    TRUEMONEY: "#FF6600",
    PROMPTPAY: "#003B71",
};

function getBankColor(bank: string | null): string {
    if (!bank) return "#9ca3af";
    const key = bank.toUpperCase().replaceAll(/\s+/g, "");
    return BANK_COLORS[key] || "#6366f1";
}

function parseDateRange(params: URLSearchParams) {
    const startParam = params.get("startDate");
    const endParam = params.get("endDate");
    const dateParam = params.get("date");

    if (startParam && endParam) {
        const start = new Date(startParam);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endParam);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
        if ((session?.user as { role?: string })?.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const { start, end } = parseDateRange(request.nextUrl.searchParams);

        const topupList = await db.query.topups.findMany({
            where: (t, { and, gte, lte }) => and(gte(t.createdAt, start.toISOString().slice(0, 19).replace("T", " ")), lte(t.createdAt, end.toISOString().slice(0, 19).replace("T", " "))),
            with: { user: { columns: { username: true } } },
            orderBy: (t, { desc }) => desc(t.createdAt),
        });
        // alias
        const topups_data = topupList;

        // ── Single Pass Processing ──────────────────────────
        const statusSummary = {
            approved: { count: 0, amount: 0 },
            pending: { count: 0, amount: 0 },
            rejected: { count: 0, amount: 0 },
        };
        const hourlyMap = new Map<number, number>(Array.from({ length: 24 }, (_, i) => [i, 0]));
        const methodMap = new Map<string, { count: number; amount: number }>();

        for (const t of topups_data) {
            const amt = Number(t.amount);
            
            if (t.status === "APPROVED") {
                statusSummary.approved.count++;
                statusSummary.approved.amount += amt;
                
                const hour = new Date(t.createdAt).getHours();
                hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + amt);
                
                const bank = t.senderBank || "ไม่ระบุ";
                const existing = methodMap.get(bank) || { count: 0, amount: 0 };
                existing.count++;
                existing.amount += amt;
                methodMap.set(bank, existing);
            } else if (t.status === "PENDING") {
                statusSummary.pending.count++;
                statusSummary.pending.amount += amt;
            } else if (t.status === "REJECTED") {
                statusSummary.rejected.count++;
                statusSummary.rejected.amount += amt;
            }
        }
        const hourlyData = Array.from(hourlyMap.entries()).map(([hour, amount]) => ({
            hour: `${hour.toString().padStart(2, "0")}:00`,
            amount,
        }));

        const paymentMethods = Array.from(methodMap.entries()).map(
            ([name, data]) => ({
                name,
                count: data.count,
                amount: data.amount,
                color: getBankColor(name),
            })
        );

        // ── Total KPI ────────────────────────────────────
        const totalAmount = statusSummary.approved.amount;
        const allTransactions = topups_data.length;
        const uniqueUsers = new Set(
            topups_data.filter((t) => t.status === "APPROVED").map((t) => t.userId)
        );
        const averagePerTransaction =
            statusSummary.approved.count > 0
                ? Math.round(totalAmount / statusSummary.approved.count)
                : 0;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        return NextResponse.json({
            success: true,
            data: {
                date: todayStart.toISOString(),
                totalAmount,
                totalPeople: uniqueUsers.size,
                totalTransactions: statusSummary.approved.count,
                allTransactions,
                averagePerTransaction,
                statusSummary,
                hourlyData,
                paymentMethods,
                records: topups_data.map((t) => ({
                    id: t.id,
                    username: t.user.username,
                    amount: Number(t.amount),
                    time: typeof t.createdAt === "string" ? t.createdAt : new Date(t.createdAt as string | number | Date).toISOString(),
                    status: t.status,
                    senderBank: t.senderBank,
                    proofImage: t.proofImage,
                    transactionRef: t.transactionRef,
                    rejectReason: t.rejectReason,
                })),
            },
        });
    } catch (error) {
        console.error("Topup summary error:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาด" },
            { status: 500 }
        );
    }
}
