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
import { CHART_PALETTE, formatNumber } from "@/lib/constants";

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
  /** Optional: selected year for highlighting */
  selectedYear?: number | null;
  /** Optional: callback when a data point is clicked */
  onYearClick?: (year: number) => void;
}

export function LineChart({
  data,
  xKey,
  lines,
  referenceLine,
  referenceLabel,
  yFormatter = formatNumber,
  selectedYear,
  onYearClick,
}: LineChartProps) {
  const handleClick = (data: unknown) => {
    if (onYearClick && data && typeof data === "object") {
      const entry = data as Record<string, unknown>;
      const year = entry[xKey];
      if (typeof year === "number") {
        onYearClick(year);
      }
    }
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsLineChart
        data={data}
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        onClick={handleClick}
        style={{ cursor: onYearClick ? "pointer" : "default" }}
      >
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
            stroke={CHART_PALETTE[7]}
            strokeDasharray="4 4"
            label={{ value: referenceLabel ?? "", fill: CHART_PALETTE[7], fontSize: 11 }}
          />
        )}
        {lines.map((l, index) => {
          const color = l.color ?? CHART_PALETTE[index % CHART_PALETTE.length];
          return (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label ?? l.key}
              stroke={color}
              strokeWidth={2}
              dot={(props) => {
                const isSelected = selectedYear !== null && props.payload[xKey] === selectedYear;
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={isSelected ? 6 : 0}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={2}
                    className="transition-all duration-300"
                    style={{
                      filter: isSelected ? "drop-shadow(0 0 4px rgba(0,0,0,0.3))" : "none",
                    }}
                  />
                );
              }}
              activeDot={{
                r: 5,
                fill: color,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          );
        })}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
