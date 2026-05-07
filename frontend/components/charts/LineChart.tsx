"use client";
/**
 * LineChart — generic Recharts line chart.
 * Used for: Chart A2 (views by year), Chart F1 (commercial monthly).
 */
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatNumber } from "@/lib/constants";

interface LineConfig {
  key: string;
  color?: string;
  label?: string;
}

interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  lines: LineConfig[];
  /** Optional vertical reference line x value */
  referenceLine?: string | number;
  referenceLabel?: string;
  yFormatter?: (v: number) => string;
}

export function LineChart({
  data,
  xKey,
  lines,
  referenceLine,
  referenceLabel,
  yFormatter = formatNumber,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsLineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="#f2f2f2" strokeDasharray="3 3" vertical={false} />
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
        {referenceLine != null && (
          <ReferenceLine
            x={referenceLine}
            stroke="#ff7759"
            strokeDasharray="4 4"
            label={{ value: referenceLabel ?? "", fill: "#ff7759", fontSize: 11 }}
          />
        )}
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.label ?? l.key}
            stroke={l.color ?? "#1863dc"}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: l.color ?? "#1863dc" }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
