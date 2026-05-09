"use client";
/**
 * Chart D3 — Dual-Axis Line (Plotly)
 * PM2.5 (trục trái) + Tốc độ gió (trục phải) theo ngày
 * Trực quan hóa mối quan hệ đảo ngược: đỉnh gió trùng đáy PM2.5
 */
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as React.ComponentType<PlotParams>;

export interface DualAxisPoint {
  date: string;
  pm25: number;
  wind_speed: number;
}

export interface DualAxisChartProps {
  data: DualAxisPoint[];
  title?: string;
}

export function DualAxisChart({ data, title }: DualAxisChartProps) {
  const traces: Plotly.Data[] = [
    {
      x: data.map(d => d.date),
      y: data.map(d => d.pm25),
      type: "scatter",
      mode: "lines",
      name: "PM2.5 (µg/m³)",
      line: { color: "#ef4444", width: 1.5 },
      fill: "tozeroy",
      fillcolor: "rgba(239, 68, 68, 0.08)",
      yaxis: "y",
      hovertemplate: "Ngày: %{x}<br>PM2.5: <b>%{y:.1f} µg/m³</b><extra>PM2.5</extra>",
    } as Plotly.Data,
    {
      x: data.map(d => d.date),
      y: data.map(d => d.wind_speed),
      type: "scatter",
      mode: "lines",
      name: "Tốc độ gió (m/s)",
      line: { color: "#10b981", width: 1.5 },
      yaxis: "y2",
      hovertemplate: "Ngày: %{x}<br>Gió: <b>%{y:.2f} m/s</b><extra>Gió</extra>",
    } as Plotly.Data,
  ];

  return (
    <Plot
      data={traces}
      layout={{
        title: {
          text: title || "PM2.5 & Tốc độ gió theo ngày",
          font: { size: 14, color: "#212121", family: "Space Grotesk, Inter, sans-serif" },
        },
        xaxis: {
          title: { text: "Ngày", font: { size: 12, color: "#75758a" } },
          tickfont: { size: 10, color: "#93939f" },
          gridcolor: "#f2f2f2",
          showgrid: true,
        },
        yaxis: {
          title: { text: "PM2.5 (µg/m³)", font: { color: "#ef4444", size: 12 } },
          tickfont: { size: 11, color: "#ef4444" },
          gridcolor: "#f2f2f2",
          showgrid: true,
        },
        yaxis2: {
          title: { text: "Tốc độ gió (m/s)", font: { color: "#10b981", size: 12 } },
          tickfont: { size: 11, color: "#10b981" },
          overlaying: "y",
          side: "right",
          showgrid: false,
        },
        margin: { l: 70, r: 70, t: 50, b: 60 },
        plot_bgcolor: "#ffffff",
        paper_bgcolor: "#ffffff",
        hovermode: "x unified",
        legend: {
          orientation: "h",
          x: 0.5,
          xanchor: "center",
          y: -0.15,
          font: { size: 11, color: "#75758a" },
        },
        font: { family: "Inter, Arial, sans-serif" },
        // WHO reference line at 15 µg/m³
        shapes: [
          {
            type: "line",
            x0: 0, x1: 1, xref: "paper",
            y0: 15, y1: 15,
            line: { color: "#10b981", width: 1.5, dash: "dash" },
          },
        ],
        annotations: [
          {
            x: 0.01, xref: "paper",
            y: 15, yref: "y",
            text: "WHO (15 µg/m³)",
            showarrow: false,
            font: { size: 9, color: "#10b981" },
            bgcolor: "rgba(255,255,255,0.8)",
          },
        ],
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", height: "450px" }}
      useResizeHandler
    />
  );
}
