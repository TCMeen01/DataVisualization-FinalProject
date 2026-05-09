"use client";
/**
 * Chart E1 — Year-over-Year Line Chart (Recharts)
 * So sánh cùng tháng giữa các năm
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
} from "recharts";

export interface YoYChartProps {
  data: Array<{
    month: number;
    [key: string]: number | string;
  }>;
  years: string[];
  title?: string;
  yLabel?: string;
}

export function YoYLineChart({ data, years, title, yLabel }: YoYChartProps) {
  const colors = ["#ff7e00", "#1f77b4", "#2ca02c"];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          label={{ value: "Tháng", position: "insideBottomRight", offset: -5 }}
        />
        <YAxis 
          label={{ value: yLabel || "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }}
        />
        <Tooltip 
          formatter={(value) => `${(value as number).toFixed(1)} µg/m³`}
        />
        <Legend />
        {years.map((year, idx) => (
          <Line
            key={year}
            type="monotone"
            dataKey={year}
            stroke={colors[idx] || "#999"}
            name={`Năm ${year}`}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
