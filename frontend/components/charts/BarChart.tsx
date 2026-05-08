"use client";
/**
 * BarChart — generic Recharts bar chart, horizontal or vertical.
 * Used for: Chart F2 (commercial vs non-commercial by category).
 */
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_PALETTE, formatNumber } from "@/lib/constants";

interface BarConfig {
  key: string;
  color?: string;
  label?: string;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: BarConfig[];
  layout?: "horizontal" | "vertical";
  yFormatter?: (v: number) => string;
}

export function BarChart({
  data,
  xKey,
  bars,
  layout = "vertical",
  yFormatter = formatNumber,
}: BarChartProps) {
  const isHorizontal = layout === "horizontal";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsBarChart
        data={data}
        layout={isHorizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
      >
        <CartesianGrid stroke="#f2f2f2" strokeDasharray="3 3" horizontal={!isHorizontal} vertical={isHorizontal} />
        {isHorizontal ? (
          <>
            <XAxis
              type="number"
              tickFormatter={yFormatter}
              tick={{ fontSize: 12, fill: "#93939f" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "#93939f" }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "#93939f" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={yFormatter}
              tick={{ fontSize: 12, fill: "#93939f" }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #d9d9dd",
            borderRadius: 8,
            fontSize: 13,
            color: "#212121",
          }}
          formatter={(v) => yFormatter(v as number)}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "#75758a" }}>{value}</span>
          )}
        />
        {bars.map((b, index) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.label ?? b.key}
            fill={b.color ?? CHART_PALETTE[index % CHART_PALETTE.length]}
            radius={isHorizontal ? [0, 2, 2, 0] : [2, 2, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
