"use client";
/**
 * Chart C3 — Stacked Bar % AQI theo khung giờ (Recharts)
 */
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { AQI_COLORS } from "@/lib/constants";

export interface StackedBarData {
  timeBlock: string;
  Good: number;
  Moderate: number;
  "Unhealthy (Sensitive)": number;
  Unhealthy: number;
  "Very Unhealthy": number;
  Hazardous: number;
}

export interface StackedBarChartProps {
  data: StackedBarData[];
}

export function StackedBarChart({ data }: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timeBlock" />
        <YAxis label={{ value: "% giờ", angle: -90, position: "insideLeft" }} />
        <Tooltip 
          formatter={(value) => `${(value as number).toFixed(1)}%`}
        />
        <Legend />
        <Bar dataKey="Good" stackId="aqi" fill={AQI_COLORS.Good} />
        <Bar dataKey="Moderate" stackId="aqi" fill={AQI_COLORS.Moderate} />
        <Bar dataKey="Unhealthy (Sensitive)" stackId="aqi" fill={AQI_COLORS.Unhealthy_Sensitive} />
        <Bar dataKey="Unhealthy" stackId="aqi" fill={AQI_COLORS.Unhealthy} />
        <Bar dataKey="Very Unhealthy" stackId="aqi" fill={AQI_COLORS.Very_Unhealthy} />
        <Bar dataKey="Hazardous" stackId="aqi" fill={AQI_COLORS.Hazardous} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
