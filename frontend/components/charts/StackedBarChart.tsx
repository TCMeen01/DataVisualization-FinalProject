"use client";
/**
 * StackedBarChart — Recharts stacked bar chart.
 * Used for: Chart B2 (short vs long videos by year/quarter).
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/constants";

interface BarConfig {
  key: string;
  color?: string;
  label?: string;
}

interface StackedBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: BarConfig[];
}

export function StackedBarChart({ data, xKey, bars }: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="#f2f2f2" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: "#93939f" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatNumber}
          tick={{ fontSize: 12, fill: "#93939f" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #d9d9dd",
            borderRadius: 8,
            fontSize: 13,
            color: "#212121",
          }}
          formatter={(v) => formatNumber(v as number)}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "#75758a" }}>{value}</span>
          )}
        />
        {bars.map((b) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.label ?? b.key}
            stackId="stack"
            fill={b.color ?? "#1863dc"}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
