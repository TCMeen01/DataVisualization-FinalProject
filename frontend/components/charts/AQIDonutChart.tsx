"use client";
/**
 * Chart A1 — Phân bổ mức AQI (Donut)
 * Data: AQI category distribution
 * Click slice → trigger cross-filter
 */
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { AQI_COLORS } from "@/lib/constants";

export interface AQIDonutChartProps {
  data: Array<{ category: string; count: number }>;
  onSliceClick?: (category: string) => void;
}

export function AQIDonutChart({ data, onSliceClick }: AQIDonutChartProps) {
  const colorMap: Record<string, string> = {
    "Good": AQI_COLORS.Good,
    "Moderate": AQI_COLORS.Moderate,
    "Unhealthy (Sensitive)": AQI_COLORS.Unhealthy_Sensitive,
    "Unhealthy": AQI_COLORS.Unhealthy,
    "Very Unhealthy": AQI_COLORS.Very_Unhealthy,
    "Hazardous": AQI_COLORS.Hazardous,
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="count"
          onClick={(entry) => onSliceClick?.(entry.payload.category)}
        >
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={colorMap[entry.category] || "#999"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `${value} giờ`}
          labelFormatter={(label) => `Mức: ${label}`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
