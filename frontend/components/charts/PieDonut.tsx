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
import { CATEGORY_COLORS, CHART_PALETTE } from "@/lib/constants";

interface PieDonutProps {
  data: { name: string; value: number; category?: string }[];
  onSliceClick?: (name: string) => void;
  selectedSlice?: string | null;
}

export function PieDonut({ data, onSliceClick, selectedSlice }: PieDonutProps) {
  const handleClick = (entry: { name?: string; category?: string }) => {
    const value = entry.category ?? entry.name;
    if (onSliceClick && value) {
      onSliceClick(value === selectedSlice ? "" : value);
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
          {data.map((entry, index) => {
            const isSelected = selectedSlice === (entry.category ?? entry.name);
            const hasSelection = selectedSlice !== null && selectedSlice !== "";

            return (
              <Cell
                key={entry.name}
                fill={CATEGORY_COLORS[entry.category ?? entry.name] ?? CHART_PALETTE[index % CHART_PALETTE.length]}
                opacity={!hasSelection || isSelected ? 1 : 0.4}
                className="transition-opacity duration-300 hover:opacity-70"
              />
            );
          })}
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
