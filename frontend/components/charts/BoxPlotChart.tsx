"use client";
/**
 * Chart B1, F1 — Box Plot (Plotly)
 * Generic box plot wrapper
 */
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface BoxPlotData {
  name: string;
  y: number[];
  color?: string;
}

export interface BoxPlotChartProps {
  data: BoxPlotData[];
  title?: string;
  yLabel?: string;
}

export function BoxPlotChart({ data, title, yLabel }: BoxPlotChartProps) {
  const traces = data.map(d => ({
    y: d.y,
    name: d.name,
    type: "box" as const,
    boxmean: "sd" as const,
    marker: { color: d.color || "#1f77b4" },
  }));

  return (
    <Plot
      data={traces}
      layout={{
        title: title || "Box Plot",
        yaxis: { title: yLabel || "PM2.5 (µg/m³)" },
        hovermode: "closest",
        margin: { l: 80, r: 30, t: 60, b: 60 },
        plot_bgcolor: "#ffffff",
        paper_bgcolor: "#ffffff",
      }}
      style={{ width: "100%", height: "400px" }}
    />
  );
}
