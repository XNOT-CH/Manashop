"use client";

import { useState, useEffect, useCallback } from "react";
import cubejsApi from "@/lib/cubejs";
import type { ResultSet } from "@cubejs-client/core";

// ─── Types ──────────────────────────────────────────────
type Granularity = "day" | "month" | "year";

interface ChartDataPoint {
    date: string;
    revenue: number;
    orders: number;
}

interface KpiData {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
}

interface UseDashboardDataReturn {
    chartData: ChartDataPoint[];
    kpiData: KpiData;
    granularity: Granularity;
    setGranularity: (g: Granularity) => void;
    isLoading: boolean;
}

// ─── Date Formatting ────────────────────────────────────
function formatDateLabel(raw: string, granularity: Granularity): string {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;

    switch (granularity) {
        case "day":
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }); // "Feb 12"
        case "month":
            return d.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
            }); // "Feb 26"
        case "year":
            return d.getFullYear().toString(); // "2026"
        default:
            return raw;
    }
}

// ─── Hook ───────────────────────────────────────────────
export function useDashboardData(): UseDashboardDataReturn {
    const [granularity, setGranularity] = useState<Granularity>("month");
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [kpiData, setKpiData] = useState<KpiData>({
        totalRevenue: 0,
        totalOrders: 0,
        totalUsers: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    // ── Fetch time-series chart data ────────────────────
    const fetchChartData = useCallback(async () => {
        try {
            const resultSet: ResultSet = await cubejsApi.load({
                measures: ["Orders.totalRevenue", "Orders.count"],
                timeDimensions: [
                    {
                        dimension: "Orders.createdAt",
                        granularity,
                    },
                ],
                order: { "Orders.createdAt": "asc" },
            });

            const pivoted = resultSet.chartPivot();

            const formatted: ChartDataPoint[] = pivoted.map((row) => ({
                date: formatDateLabel(row.x as string, granularity),
                revenue: Number(row["Orders.totalRevenue"] ?? 0),
                orders: Number(row["Orders.count"] ?? 0),
            }));

            setChartData(formatted);
        } catch (err) {
            console.error("[useDashboardData] chart fetch error:", err);
            setChartData([]);
        }
    }, [granularity]);

    // ── Fetch KPI totals ────────────────────────────────
    const fetchKpiData = useCallback(async () => {
        try {
            const [revenueResult, usersResult] = await Promise.all([
                cubejsApi.load({
                    measures: ["Orders.totalRevenue", "Orders.count"],
                }),
                cubejsApi.load({
                    measures: ["Users.count"],
                }),
            ]);

            const revRow = revenueResult.tablePivot()[0] || {};
            const userRow = usersResult.tablePivot()[0] || {};

            setKpiData({
                totalRevenue: Number(revRow["Orders.totalRevenue"] ?? 0),
                totalOrders: Number(revRow["Orders.count"] ?? 0),
                totalUsers: Number(userRow["Users.count"] ?? 0),
            });
        } catch (err) {
            console.error("[useDashboardData] KPI fetch error:", err);
        }
    }, []);

    // ── Effect — refetch when granularity changes ───────
    useEffect(() => {
        let cancelled = false;

        async function load() {
            setIsLoading(true);

            await Promise.all([fetchChartData(), fetchKpiData()]);

            if (!cancelled) setIsLoading(false);
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [fetchChartData, fetchKpiData]);

    return { chartData, kpiData, granularity, setGranularity, isLoading };
}
