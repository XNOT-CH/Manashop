"use client";

import { useState } from "react";
import { RevenueAreaChart } from "@/components/admin/RevenueAreaChart";

// ─── Placeholder Data ───────────────────────────────────
const dailyData = [
    { date: "2026-02-06", revenue: 4200 },
    { date: "2026-02-07", revenue: 5800 },
    { date: "2026-02-08", revenue: 3900 },
    { date: "2026-02-09", revenue: 6700 },
    { date: "2026-02-10", revenue: 8200 },
    { date: "2026-02-11", revenue: 9400 },
    { date: "2026-02-12", revenue: 7100 },
];

const weeklyData = [
    { date: "2026-01-19", revenue: 28000 },
    { date: "2026-01-26", revenue: 35000 },
    { date: "2026-02-02", revenue: 31000 },
    { date: "2026-02-09", revenue: 42000 },
];

const monthlyData = [
    { date: "2025-03-01", revenue: 48000 },
    { date: "2025-04-01", revenue: 61000 },
    { date: "2025-05-01", revenue: 55000 },
    { date: "2025-06-01", revenue: 67000 },
    { date: "2025-07-01", revenue: 72000 },
    { date: "2025-08-01", revenue: 69000 },
    { date: "2025-09-01", revenue: 78000 },
    { date: "2025-10-01", revenue: 82000 },
    { date: "2025-11-01", revenue: 91000 },
    { date: "2025-12-01", revenue: 105000 },
    { date: "2026-01-01", revenue: 98000 },
    { date: "2026-02-01", revenue: 112000 },
];

const yearlyData = [
    { date: "2022-01-01", revenue: 480000 },
    { date: "2023-01-01", revenue: 650000 },
    { date: "2024-01-01", revenue: 890000 },
    { date: "2025-01-01", revenue: 1120000 },
    { date: "2026-01-01", revenue: 1350000 },
];

type Granularity = "day" | "week" | "month" | "year";

const dataMap: Record<Granularity, typeof dailyData> = {
    day: dailyData,
    week: weeklyData,
    month: monthlyData,
    year: yearlyData,
};

const granularityLabels: Record<Granularity, string> = {
    day: "วัน",
    week: "สัปดาห์",
    month: "เดือน",
    year: "ปี",
};

// ─── Component ──────────────────────────────────────────
export function RevenueChart() {
    const [granularity, setGranularity] = useState<Granularity>("month");
    const data = dataMap[granularity];

    return (
        <div>
            {/* Header with Granularity Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h3 className="text-lg font-semibold">แนวโน้มรายได้</h3>
                    <p className="text-sm text-muted-foreground">
                        ภาพรวมผลประกอบการด้านรายได้
                    </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                    {(Object.keys(granularityLabels) as Granularity[]).map(
                        (key) => (
                            <button
                                key={key}
                                onClick={() => setGranularity(key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${granularity === key
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {granularityLabels[key]}
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Chart */}
            <RevenueAreaChart data={data} granularity={granularity} />
        </div>
    );
}
