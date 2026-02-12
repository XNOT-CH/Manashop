"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Wallet,
    Users,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Banknote,
    AlertTriangle,
    Eye,
    X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────
interface TopupRecord {
    id: string;
    username: string;
    amount: number;
    time: string;
    status: string;
    senderBank: string | null;
    proofImage: string | null;
}

interface StatusSummary {
    approved: { count: number; amount: number };
    pending: { count: number; amount: number };
    rejected: { count: number; amount: number };
}

interface HourlyDataPoint {
    hour: string;
    amount: number;
}

interface PaymentMethod {
    name: string;
    count: number;
    amount: number;
    color: string;
}

interface TopupSummary {
    date: string;
    totalAmount: number;
    totalPeople: number;
    totalTransactions: number;
    statusSummary: StatusSummary;
    hourlyData: HourlyDataPoint[];
    paymentMethods: PaymentMethod[];
    records: TopupRecord[];
}

// ─── Status Badge ───────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
        APPROVED: {
            icon: <CheckCircle className="h-3 w-3" />,
            label: "สำเร็จ",
            className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        },
        PENDING: {
            icon: <Clock className="h-3 w-3" />,
            label: "รอตรวจสอบ",
            className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        },
        REJECTED: {
            icon: <XCircle className="h-3 w-3" />,
            label: "ล้มเหลว",
            className: "bg-red-500/10 text-red-600 dark:text-red-400",
        },
    };
    const c = config[status] || config.PENDING;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
            {c.icon}
            {c.label}
        </span>
    );
}

// ─── Slip Image Modal ───────────────────────────────────
function SlipModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative max-w-md w-full mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden animate-page-enter"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">รูปสลิป</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-4">
                    <img
                        src={imageUrl}
                        alt="สลิปการโอนเงิน"
                        className="w-full rounded-xl"
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Weekly Chart Custom Tooltip ────────────────────────
function WeeklyTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-border/60 bg-white px-4 py-3 shadow-xl dark:bg-slate-900 dark:border-slate-700/60" style={{ minWidth: 150 }}>
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-bold text-foreground tabular-nums">
                ฿{payload[0].value.toLocaleString()}
            </p>
        </div>
    );
}

// ─── Hourly Chart Custom Tooltip ────────────────────────
function HourlyTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-border/60 bg-white px-4 py-3 shadow-xl dark:bg-slate-900 dark:border-slate-700/60" style={{ minWidth: 140 }}>
            <p className="text-xs font-medium text-muted-foreground mb-1">{label} น.</p>
            <p className="text-sm font-bold text-foreground tabular-nums">
                ฿{payload[0].value.toLocaleString()}
            </p>
        </div>
    );
}

// ─── Component ──────────────────────────────────────────
interface WeeklyDataPoint {
    date: string;
    amount: number;
}

export function DailyTopupSummary({ selectedDate }: { selectedDate?: string }) {
    const [data, setData] = useState<TopupSummary | null>(null);
    const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [slipImage, setSlipImage] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const dateQuery = selectedDate ? `?date=${selectedDate}` : "";
                const [summaryRes, trendRes] = await Promise.all([
                    fetch(`/api/dashboard/topup-summary${dateQuery}`),
                    fetch(`/api/dashboard/topup-trend${dateQuery}`),
                ]);
                const summaryJson = await summaryRes.json();
                const trendJson = await trendRes.json();
                if (summaryJson.success) {
                    setData(summaryJson.data);
                }
                if (trendJson.success) {
                    setWeeklyData(trendJson.data);
                }
            } catch (err) {
                console.error("Failed to fetch topup summary:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [selectedDate]);

    // Format today's date in Thai
    const todayFormatted = new Date().toLocaleDateString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Payment methods total for percentage calc
    const methodsTotal = data?.paymentMethods?.reduce((s, m) => s + m.amount, 0) || 0;

    // ── Loading State ───────────────────────────────────
    if (isLoading) {
        return (
            <Card className="bg-card">
                <CardContent className="py-12 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">กำลังโหลด...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Slip Image Modal */}
            {slipImage && <SlipModal imageUrl={slipImage} onClose={() => setSlipImage(null)} />}

            {/* Section Header */}
            <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    สรุปยอดเติมเงินวันนี้
                </h2>
                <p className="text-sm text-muted-foreground">{todayFormatted}</p>
            </div>

            {/* ═══════════════════════════════════════════
                7-Day Trend Area Chart
               ═══════════════════════════════════════════ */}
            <Card className="bg-card overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        📊 แนวโน้มเติมเงิน 7 วันย้อนหลัง
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {weeklyData.length > 0 && weeklyData.some((d) => d.amount > 0) ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart
                                data={weeklyData}
                                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="weeklyGradientFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                                        <stop offset="50%" stopColor="#6366f1" stopOpacity={0.12} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="weeklyStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="var(--color-border)"
                                    strokeOpacity={0.6}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--color-muted-foreground)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={8}
                                />
                                <YAxis
                                    tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                                    stroke="var(--color-muted-foreground)"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    width={50}
                                />
                                <RechartsTooltip content={<WeeklyTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="url(#weeklyStrokeGrad)"
                                    strokeWidth={2.5}
                                    fill="url(#weeklyGradientFill)"
                                    dot={{ r: 4, fill: "#8b5cf6", stroke: "#ffffff", strokeWidth: 2 }}
                                    activeDot={{
                                        r: 6,
                                        fill: "#8b5cf6",
                                        stroke: "#ffffff",
                                        strokeWidth: 2.5,
                                    }}
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
                            <TrendingUp className="h-10 w-10 opacity-20 mb-2" />
                            <p className="text-sm">ยังไม่มีข้อมูลเติมเงิน</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════
                KPI Cards (2 cards)
               ═══════════════════════════════════════════ */}
            <div className="grid gap-4 sm:grid-cols-2">
                {/* Total Amount */}
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    ยอดเติมรวม (สำเร็จ)
                                </p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    ฿{(data?.totalAmount ?? 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                <Banknote className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {data?.totalTransactions ?? 0} รายการ
                        </p>
                    </CardContent>
                </Card>

                {/* Total People */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    จำนวนคนเติม
                                </p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {data?.totalPeople ?? 0}
                                    <span className="text-base font-normal text-muted-foreground ml-1">คน</span>
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ═══════════════════════════════════════════
                Transaction Status Cards (3 cards)
               ═══════════════════════════════════════════ */}
            <div className="grid gap-3 grid-cols-3">
                {/* Approved */}
                <Card className="border-emerald-500/20">
                    <CardContent className="pt-4 pb-4 px-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">สำเร็จ</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground tabular-nums">
                            {data?.statusSummary?.approved.count ?? 0}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            ฿{(data?.statusSummary?.approved.amount ?? 0).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                {/* Pending */}
                <Card className={`border-amber-500/20 ${(data?.statusSummary?.pending.count ?? 0) > 0 ? "ring-2 ring-amber-500/30 animate-pulse" : ""}`}>
                    <CardContent className="pt-4 pb-4 px-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">รอตรวจสอบ</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground tabular-nums">
                            {data?.statusSummary?.pending.count ?? 0}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                            ฿{(data?.statusSummary?.pending.amount ?? 0).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                {/* Rejected */}
                <Card className="border-red-500/20">
                    <CardContent className="pt-4 pb-4 px-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-red-500/15 flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-red-500" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">ล้มเหลว</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground tabular-nums">
                            {data?.statusSummary?.rejected.count ?? 0}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">
                            ฿{(data?.statusSummary?.rejected.amount ?? 0).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ═══════════════════════════════════════════
                Charts Row — Hourly Trend + Payment Methods
               ═══════════════════════════════════════════ */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
                {/* Hourly Trend Area Chart — 3 columns */}
                <Card className="lg:col-span-3 bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            📈 แนวโน้มรายชั่วโมง
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data?.hourlyData && data.hourlyData.some((h) => h.amount > 0) ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart
                                    data={data.hourlyData}
                                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="hourlyGradientFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                                            <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.12} />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="hourlyStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="var(--color-border)"
                                        strokeOpacity={0.6}
                                    />
                                    <XAxis
                                        dataKey="hour"
                                        stroke="var(--color-muted-foreground)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={8}
                                        interval={2}
                                    />
                                    <YAxis
                                        tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
                                        stroke="var(--color-muted-foreground)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        width={45}
                                    />
                                    <RechartsTooltip content={<HourlyTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="url(#hourlyStrokeGrad)"
                                        strokeWidth={2.5}
                                        fill="url(#hourlyGradientFill)"
                                        dot={false}
                                        activeDot={{
                                            r: 5,
                                            fill: "#10b981",
                                            stroke: "#ffffff",
                                            strokeWidth: 2,
                                        }}
                                        animationDuration={800}
                                        animationEasing="ease-out"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
                                <TrendingUp className="h-10 w-10 opacity-20 mb-2" />
                                <p className="text-sm">ยังไม่มีข้อมูลเติมเงินวันนี้</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Method Donut Chart — 2 columns */}
                <Card className="lg:col-span-2 bg-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            🍩 สัดส่วนช่องทาง
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data?.paymentMethods && data.paymentMethods.length > 0 ? (
                            <div className="flex flex-col items-center gap-4">
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={data.paymentMethods}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="amount"
                                            stroke="none"
                                        >
                                            {data.paymentMethods.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                    className="transition-opacity hover:opacity-80"
                                                />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            formatter={(value: number) => [`฿${value.toLocaleString()}`, "ยอดเงิน"]}
                                            contentStyle={{
                                                backgroundColor: "var(--color-card)",
                                                borderColor: "var(--color-border)",
                                                borderRadius: "12px",
                                                boxShadow: "0 10px 30px -5px rgba(0,0,0,0.15)",
                                                color: "var(--color-foreground)",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Legend */}
                                <div className="grid grid-cols-1 gap-2 w-full">
                                    {data.paymentMethods.map((m) => (
                                        <div key={m.name} className="flex items-center gap-2.5 text-sm">
                                            <div
                                                className="h-3 w-3 rounded-full shrink-0"
                                                style={{ backgroundColor: m.color }}
                                            />
                                            <span className="text-muted-foreground truncate">{m.name}</span>
                                            <span className="ml-auto font-medium tabular-nums text-xs">
                                                {methodsTotal > 0 ? ((m.amount / methodsTotal) * 100).toFixed(0) : 0}%
                                            </span>
                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                ({m.count})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground">
                                <Wallet className="h-10 w-10 opacity-20 mb-2" />
                                <p className="text-sm">ยังไม่มีข้อมูล</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ═══════════════════════════════════════════
                Enhanced Detail Table
               ═══════════════════════════════════════════ */}
            {data && data.records.length > 0 ? (
                <Card className="bg-card overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            📝 รายละเอียดการเติมเงิน
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            #
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            ผู้ใช้
                                        </th>
                                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                                            จำนวนเงิน
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            ช่องทาง
                                        </th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                            เวลา
                                        </th>
                                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                                            สลิป
                                        </th>
                                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                                            สถานะ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.records.map((record, idx) => (
                                        <tr
                                            key={record.id}
                                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {record.username}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                +฿{record.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-xs font-medium">
                                                    🏦 {record.senderBank || "ไม่ระบุ"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {new Date(record.time).toLocaleTimeString("th-TH", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {record.proofImage ? (
                                                    <button
                                                        onClick={() => setSlipImage(record.proofImage)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        ดูสลิป
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={record.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-card">
                    <CardContent className="py-8 text-center">
                        <Wallet className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">
                            ยังไม่มีรายการเติมเงินวันนี้
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
