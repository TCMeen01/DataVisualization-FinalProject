"use client";
/**
 * ScatterPlotly — dynamic-imported Plotly scatter chart.
 * Used for: Chart C2 (sub vs avg_view), Chart D1 (view vs like_view_ratio suspect).
 * SSR disabled via next/dynamic.
 */
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import { CHART_PALETTE } from "@/lib/constants";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as React.ComponentType<PlotParams>;

interface ScatterTrace {
  name: string;
  x: number[];
  y: number[];
  text?: string[];
  marker?: Partial<Plotly.PlotMarker>;
  markerSize?: number;
}

interface ScatterPlotlyProps {
  traces: ScatterTrace[];
  xAxisType?: "log" | "linear";
  xLabel?: string;
  yLabel?: string;
  height?: number;
  markerSize?: number;
}

export function ScatterPlotly({
  traces,
  xAxisType = "linear",
  xLabel,
  yLabel,
  height = 320,
  markerSize = 5,
}: ScatterPlotlyProps) {
  return (
    <Plot
      data={traces.map((t, index) => ({
        type: "scatter",
        mode: "markers",
        name: t.name,
        x: t.x,
        y: t.y,
        text: t.text,
        hovertemplate: t.text
          ? "<b>%{text}</b><br>x: %{x}<br>y: %{y}<extra></extra>"
          : "x: %{x}<br>y: %{y}<extra></extra>",
        marker: {
          size: t.markerSize ?? markerSize,
          opacity: 0.75,
          color: t.marker?.color ?? CHART_PALETTE[index % CHART_PALETTE.length],
          line: { width: 0.5, color: "#ffffff" },
          ...t.marker,
        },
      } as Plotly.Data))}
      layout={{
        paper_bgcolor: "#ffffff",
        plot_bgcolor: "#f9fafb",
        height,
        margin: { t: 8, r: 8, b: 60, l: 60 },
        font: { family: "Inter, Arial, sans-serif", size: 12, color: "#212121" },
        showlegend: traces.length > 1,
        legend: { font: { size: 11, color: "#75758a" } },
        xaxis: {
          title: xLabel ? { text: xLabel } : undefined,
          type: xAxisType,
          showgrid: true,
          gridcolor: "#f2f2f2",
          tickfont: { size: 11, color: "#93939f" },
          automargin: true,
        },
        yaxis: {
          title: yLabel ? { text: yLabel } : undefined,
          showgrid: true,
          gridcolor: "#f2f2f2",
          tickfont: { size: 11, color: "#93939f" },
          automargin: true,
        },
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
