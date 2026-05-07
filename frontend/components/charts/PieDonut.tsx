"use client";
/**
 * PieDonut — Recharts donut/pie chart for category distribution.
 * Chart A1: Overview page. Supports onClick cross-filter callback.
 */
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CATEGORY_COLORS } from "@/lib/constants";

interface PieDonutProps {
  data: { name: string; value: number }[];
  onSliceClick?: (name: string) => void;
  selectedSlice?: string | null;
}

export function PieDonut({ data, onSliceClick, selectedSlice }: PieDonutProps) {
  const handleClick = (entry: { name?: string }) => {
    if (onSliceClick && entry.name) {
      // Toggle: clicking selected slice resets filter
      onSliceClick(entry.name === selectedSlice ? "" : entry.name);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={110}
          dataKey="value"
          onClick={handleClick}
          cursor={onSliceClick ? "pointer" : "default"}
          strokeWidth={1}
          stroke="#f2f2f2"
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={CATEGORY_COLORS[entry.name] ?? "#93939f"}
              opacity={
                !selectedSlice || selectedSlice === entry.name ? 1 : 0.35
              }
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #d9d9dd",
            borderRadius: 8,
            fontSize: 13,
            color: "#212121",
          }}
          formatter={(v) =>
            new Intl.NumberFormat("vi-VN").format(v as number)
          }
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "#75758a" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
