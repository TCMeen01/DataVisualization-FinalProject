"use client";
/**
 * Chart E3 — Rolling Average Trend (Recharts)
 * Raw + 7-day + 30-day
 */
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export interface RollingData {
  date: string;
  raw: number;
  avg7: number;
  avg30: number;
}

export interface RollingAverageChartProps {
  data: RollingData[];
}

export function RollingAverageChart({ data }: RollingAverageChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 11 }}
        />
        <YAxis 
          label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }}
        />
        <Tooltip 
          formatter={(value) => `${(value as number).toFixed(1)} µg/m³`}
        />
        <Legend />
        <ReferenceLine 
          y={15} 
          stroke="#00e400" 
          strokeDasharray="5 5" 
          label="WHO (15)"
        />
        <Line 
          type="monotone" 
          dataKey="raw" 
          stroke="#ccc" 
          name="Raw (ngày)"
          dot={false}
          strokeWidth={1}
          isAnimationActive={false}
        />
        <Line 
          type="monotone" 
          dataKey="avg7" 
          stroke="#ff7e00" 
          name="7-day MA"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="avg30" 
          stroke="#ff0000" 
          name="30-day MA (xu hướng)"
          dot={false}
          strokeWidth={2}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
