"use client";
/**
 * Chart F2 — Grouped Bar: PM2.5 theo ngày × mùa (Recharts)
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
import { SEASON_COLORS } from "@/lib/constants";

export interface GroupedBarData {
  dayOfWeek: string;
  Spring: number;
  Summer: number;
  Autumn: number;
  Winter: number;
}

export interface GroupedBarChartProps {
  data: GroupedBarData[];
}

export function GroupedBarChart({ data }: GroupedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dayOfWeek" />
        <YAxis label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }} />
        <Tooltip 
          formatter={(value) => `${(value as number).toFixed(1)} µg/m³`}
        />
        <Legend />
        <Bar dataKey="Spring" fill={SEASON_COLORS.Spring} />
        <Bar dataKey="Summer" fill={SEASON_COLORS.Summer} />
        <Bar dataKey="Autumn" fill={SEASON_COLORS.Autumn} />
        <Bar dataKey="Winter" fill={SEASON_COLORS.Winter} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
