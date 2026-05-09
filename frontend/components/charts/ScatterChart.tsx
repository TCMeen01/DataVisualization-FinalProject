"use client";
/**
 * Chart B2, B3, D2 — Scatter Plot (Plotly)
 * Generic scatter with trend line
 */
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface ScatterPoint {
  x: number;
  y: number;
  group?: string;
}

export interface ScatterChartProps {
  data: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  title?: string;
  trendLine?: boolean;
  groupColors?: Record<string, string>;
}

export function ScatterChart({
  data,
  xLabel = "X",
  yLabel = "Y",
  title = "Scatter Plot",
  trendLine = true,
  groupColors = {},
}: ScatterChartProps) {
  // Group data by group field
  const grouped = data.reduce((acc, point) => {
    const g = point.group || "default";
    if (!acc[g]) acc[g] = [];
    acc[g].push(point);
    return acc;
  }, {} as Record<string, ScatterPoint[]>);

  const traces = Object.entries(grouped).map(([group, points]) => ({
    x: points.map(p => p.x),
    y: points.map(p => p.y),
    mode: "markers" as const,
    type: "scatter" as const,
    name: group,
    marker: { color: groupColors[group] || "#1f77b4", size: 6 },
  }));

  return (
    <Plot
      data={traces}
      layout={{
        title,
        xaxis: { title: xLabel },
        yaxis: { title: yLabel },
        hovermode: "closest",
        margin: { l: 80, r: 30, t: 60, b: 60 },
        plot_bgcolor: "#ffffff",
        paper_bgcolor: "#ffffff",
      }}
      style={{ width: "100%", height: "400px" }}
    />
  );
}
