"use client";
/**
 * Chart B2, B3, D2 — Scatter Plot (Plotly)
 * Generic scatter with trend line and group colors
 * Supports zoom/pan, WHO reference line, and Vietnamese hover
 */
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as React.ComponentType<PlotParams>;

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
  showWHOLine?: boolean;
}

export function ScatterChart({
  data,
  xLabel = "X",
  yLabel = "Y",
  title = "Scatter Plot",
  trendLine = true,
  groupColors = {},
  showWHOLine = true,
}: ScatterChartProps) {
  // Group data by group field
  const grouped = data.reduce((acc, point) => {
    const g = point.group || "default";
    if (!acc[g]) acc[g] = [];
    acc[g].push(point);
    return acc;
  }, {} as Record<string, ScatterPoint[]>);

  const traces: Plotly.Data[] = Object.entries(grouped).map(([group, points]) => ({
    x: points.map(p => p.x),
    y: points.map(p => p.y),
    mode: "markers" as const,
    type: "scatter" as const,
    name: group === "default" ? "" : group,
    marker: {
      color: groupColors[group] || "#1f77b4",
      size: 5,
      opacity: 0.6,
      line: { width: 0.5, color: "#ffffff" },
    },
    hovertemplate: `${xLabel}: %{x:.2f}<br>${yLabel}: <b>%{y:.1f}</b><extra>${group}</extra>`,
  }));

  // Shapes: WHO reference line
  const shapes: Partial<Plotly.Shape>[] = [];
  const annotations: Partial<Plotly.Annotations>[] = [];
  if (showWHOLine && yLabel.includes("PM2.5")) {
    shapes.push({
      type: "line",
      x0: 0, x1: 1, xref: "paper",
      y0: 15, y1: 15,
      line: { color: "#10b981", width: 1.5, dash: "dash" },
    });
    annotations.push({
      x: 1, xref: "paper", xanchor: "right",
      y: 15, yref: "y",
      text: "WHO 15 µg/m³",
      showarrow: false,
      font: { size: 9, color: "#10b981" },
      bgcolor: "rgba(255,255,255,0.8)",
    });
  }

  return (
    <Plot
      data={traces}
      layout={{
        title: title
          ? { text: title, font: { size: 14, color: "#212121", family: "Space Grotesk, Inter, sans-serif" } }
          : undefined,
        xaxis: {
          title: { text: xLabel, font: { size: 12, color: "#75758a" } },
          gridcolor: "#f2f2f2",
          tickfont: { size: 11, color: "#93939f" },
          automargin: true,
        },
        yaxis: {
          title: { text: yLabel, font: { size: 12, color: "#75758a" } },
          gridcolor: "#f2f2f2",
          tickfont: { size: 11, color: "#93939f" },
          automargin: true,
        },
        hovermode: "closest",
        margin: { l: 70, r: 30, t: title ? 50 : 20, b: 60 },
        plot_bgcolor: "#ffffff",
        paper_bgcolor: "#ffffff",
        showlegend: Object.keys(grouped).length > 1,
        legend: {
          orientation: "h",
          x: 0.5, xanchor: "center",
          y: -0.18,
          font: { size: 11, color: "#75758a" },
        },
        font: { family: "Inter, Arial, sans-serif" },
        shapes,
        annotations,
      }}
      config={{ responsive: true, displayModeBar: true, modeBarButtonsToRemove: ["lasso2d", "select2d"] }}
      style={{ width: "100%", height: "400px" }}
      useResizeHandler
    />
  );
}
