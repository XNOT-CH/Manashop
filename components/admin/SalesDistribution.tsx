"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
    { name: "ทรูวอลเล็ท", value: 4200, color: "#3b82f6" },
    { name: "โอนผ่านธนาคาร", value: 3100, color: "#8b5cf6" },
    { name: "บัตรเครดิต", value: 2800, color: "#0ea5e9" },
    { name: "พร้อมเพย์", value: 1900, color: "#10b981" },
];

const total = data.reduce((sum, item) => sum + item.value, 0);

export function SalesDistribution() {
    return (
        <div>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">สัดส่วนยอดขาย</h3>
                <p className="text-sm text-muted-foreground">
                    แยกตามช่องทางชำระเงิน
                </p>
            </div>

            <div className="flex flex-col items-center gap-6">
                {/* Pie Chart */}
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    className="transition-opacity hover:opacity-80"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [
                                `฿${value.toLocaleString()}`,
                                "Amount",
                            ]}
                            contentStyle={{
                                backgroundColor: "var(--color-card)",
                                borderColor: "var(--color-border)",
                                borderRadius: "12px",
                                boxShadow:
                                    "0 10px 30px -5px rgba(0,0,0,0.15)",
                                color: "var(--color-foreground)",
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    {data.map((item) => (
                        <div
                            key={item.name}
                            className="flex items-center gap-2.5 text-sm"
                        >
                            <div
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-muted-foreground truncate">
                                {item.name}
                            </span>
                            <span className="ml-auto font-medium tabular-nums">
                                {((item.value / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
