"use client";
/**
 * Chart A2 — PM2.5 trung bình theo tháng (Line)
 * Timeline: 2024-01 → 2026-02
 * Reference lines: WHO (15), Unhealthy (55.5)
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

export interface PM25TimelineChartProps {
  data: Array<{ month: string; pm25: number }>;
}

export function PM25TimelineChart({ data }: PM25TimelineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          angle={-45}
          textAnchor="end"
          height={80}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          label={{ value: "PM2.5 (µg/m³)", angle: -90, position: "insideLeft" }}
        />
        <Tooltip 
          formatter={(value) => `${(value as number).toFixed(1)} µg/m³`}
          labelFormatter={(label) => `Tháng: ${label}`}
        />
        <Legend />
        <ReferenceLine 
          y={15} 
          stroke="#00e400" 
          strokeDasharray="5 5" 
          label="WHO (15 µg/m³)"
        />
        <ReferenceLine 
          y={55.5} 
          stroke="#ff0000" 
          strokeDasharray="5 5" 
          label="Unhealthy (55.5)"
        />
        <Line 
          type="monotone" 
          dataKey="pm25" 
          stroke="#ff7e00" 
          name="PM2.5 trung bình"
          dot={false}
          isAnimationActive={true}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
