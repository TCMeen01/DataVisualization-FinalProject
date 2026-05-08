"use client";
/**
 * StackedAreaChart — Recharts stacked area chart.
 * Used for: Chart A3 (short vs long ratio by year).
 */
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_PALETTE, formatPercent } from "@/lib/constants";

interface AreaConfig {
  key: string;
  color?: string;
  label?: string;
  stackId?: string;
}

interface StackedAreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  areas: AreaConfig[];
  /** If true, format Y axis as percentage */
  pct?: boolean;
}

export function StackedAreaChart({ data, xKey, areas, pct }: StackedAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="#f2f2f2" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: "#93939f" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={pct ? (v) => `${Math.round(v * 100)}%` : undefined}
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
          formatter={(v) => (pct ? formatPercent(v as number) : v)}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "#75758a" }}>{value}</span>
          )}
        />
        {areas.map((a, index) => (
          <Area
            key={a.key}
            type="monotone"
            dataKey={a.key}
            name={a.label ?? a.key}
            stackId={a.stackId ?? "stack"}
            stroke={a.color ?? CHART_PALETTE[index % CHART_PALETTE.length]}
            fill={a.color ?? CHART_PALETTE[index % CHART_PALETTE.length]}
            fillOpacity={0.6}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
