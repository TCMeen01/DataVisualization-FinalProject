"use client";
/**
 * Chart A3 — PM2.5 trung bình theo mùa (Bar)
 * Màu riêng mỗi mùa, sắp xếp Spring → Summer → Autumn → Winter
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

export interface PM25SeasonBarChartProps {
  data: Array<{ season: string; pm25: number }>;
}

export function PM25SeasonBarChart({ data }: PM25SeasonBarChartProps) {
  const colorMap: Record<string, string> = {
    "Spring": SEASON_COLORS.Spring,
    "Summer": SEASON_COLORS.Summer,
    "Autumn": SEASON_COLORS.Autumn,
    "Winter": SEASON_COLORS.Winter,
  };

  const sortedData = ["Spring", "Summer", "Autumn", "Winter"]
    .map(s => data.find(d => d.season === s))
    .filter(Boolean);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={sortedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="season" />
        <YAxis label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }} />
        <Tooltip 
          formatter={(value) => `${(value as number).toFixed(1)} µg/m³`}
        />
        <Legend />
        <Bar 
          dataKey="pm25" 
          name="PM2.5 trung bình"
          fill="#ff7e00"
          shape={(props: any) => {
            const { x, y, width, height, payload } = props;
            return (
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={colorMap[payload.season] || "#999"}
              />
            );
          }}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
