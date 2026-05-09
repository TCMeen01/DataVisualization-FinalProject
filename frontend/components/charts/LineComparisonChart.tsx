"use client";
/**
 * Chart F3 — Line so sánh profile 24 giờ: Weekday vs Weekend (Recharts)
 * Fill area giữa 2 đường
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

export interface LineComparisonData {
  hour: number;
  weekday: number;
  weekend: number;
}

export interface LineComparisonChartProps {
  data: LineComparisonData[];
  title?: string;
}

export function LineComparisonChart({ data, title }: LineComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="hour" 
          label={{ value: "Giờ", position: "insideBottomRight", offset: -5 }}
        />
        <YAxis 
          label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }}
        />
        <Tooltip 
          formatter={(value) => `${(value as number).toFixed(1)} µg/m³`}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="weekday" 
          stroke="#1f77b4" 
          name="Ngày thường (T2–T6)"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="weekend" 
          stroke="#ff7e00" 
          name="Cuối tuần (T7–CN)"
          dot={false}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
