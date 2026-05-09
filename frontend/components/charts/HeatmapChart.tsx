"use client";
/**
 * Chart C2, E2 — Heatmap (Plotly)
 */
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface HeatmapChartProps {
  z: number[][];
  x: string[];
  y: string[];
  title?: string;
  colorScale?: string;
  zLabel?: string;
}

export function HeatmapChart({
  z,
  x,
  y,
  title = "Heatmap",
  colorScale = "YlOrRd",
  zLabel = "Value",
}: HeatmapChartProps) {
  return (
    <Plot
      data={[
        {
          z,
          x,
          y,
          type: "heatmap" as const,
          colorscale: colorScale,
          hovertemplate: "X: %{x}<br>Y: %{y}<br>" + zLabel + ": %{z:.2f}<extra></extra>",
        },
      ]}
      layout={{
        title,
        xaxis: { side: "bottom" },
        yaxis: { autorange: "reversed" },
        margin: { l: 100, r: 30, t: 60, b: 60 },
        plot_bgcolor: "#ffffff",
        paper_bgcolor: "#ffffff",
      }}
      style={{ width: "100%", height: "400px" }}
    />
  );
}
