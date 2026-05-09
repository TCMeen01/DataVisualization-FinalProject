"use client";
/**
 * Chart D1 — Correlation Bar (Plotly)
 * Hệ số tương quan Pearson giữa các biến thời tiết và PM2.5
 * Horizontal bar: xanh nếu r < 0 (giảm ô nhiễm), đỏ nếu r > 0 (tăng ô nhiễm)
 * Annotation nổi bật cho humidity (r ≈ 0) và wind_spd (r < 0 đáng kể)
 */
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as React.ComponentType<PlotParams>;

export interface CorrelationItem {
  variable: string;
  label: string;
  correlation: number;
  annotation?: string;
}

export interface CorrelationBarChartProps {
  data: CorrelationItem[];
  title?: string;
}

export function CorrelationBarChart({ data, title }: CorrelationBarChartProps) {
  const correlations = data.map(d => d.correlation);
  const labels = data.map(d => d.label || d.variable);
  const colors = correlations.map(c =>
    c < -0.05 ? "#10b981" : c > 0.05 ? "#ef4444" : "#94a3b8"
  );

  // Build annotations for notable bars
  const annotations: Partial<Plotly.Annotations>[] = data
    .filter(d => d.annotation)
    .map((d, _i) => {
      const yIdx = data.indexOf(d);
      return {
        x: d.correlation > 0
          ? d.correlation + 0.02
          : d.correlation - 0.02,
        y: labels[yIdx],
        text: d.annotation || "",
        showarrow: false,
        font: {
          size: 10,
          color: d.variable === "humidity" || d.variable === "precipitation"
            ? "#ef4444"
            : d.variable === "wind_speed"
              ? "#10b981"
              : "#64748b",
          family: "Inter, Arial, sans-serif",
        },
        xanchor: d.correlation > 0 ? "left" as const : "right" as const,
      };
    });

  return (
    <Plot
      data={[
        {
          y: labels,
          x: correlations,
          type: "bar",
          orientation: "h",
          marker: {
            color: colors,
            line: { width: 1, color: "#ffffff" },
          },
          text: correlations.map(c => c.toFixed(3)),
          textposition: "auto" as const,
          textfont: { size: 11, color: "#ffffff", family: "JetBrains Mono, monospace" },
          hovertemplate: "%{y}<br>Hệ số Pearson: <b>%{x:.4f}</b><extra></extra>",
        },
      ]}
      layout={{
        title: {
          text: title || "Tương quan các biến thời tiết với PM2.5",
          font: { size: 14, color: "#212121", family: "Space Grotesk, Inter, sans-serif" },
        },
        xaxis: {
          title: { text: "Hệ số Pearson (r)", font: { size: 12, color: "#75758a" } },
          zeroline: true,
          zerolinecolor: "#d9d9dd",
          zerolinewidth: 2,
          gridcolor: "#f2f2f2",
          range: [-0.5, 0.5],
          tickfont: { size: 11, color: "#93939f" },
        },
        yaxis: {
          tickfont: { size: 12, color: "#212121" },
          automargin: true,
        },
        annotations,
        margin: { l: 150, r: 80, t: 50, b: 60 },
        plot_bgcolor: "#ffffff",
        paper_bgcolor: "#ffffff",
        font: { family: "Inter, Arial, sans-serif" },
        shapes: [
          {
            type: "line",
            x0: 0, x1: 0,
            y0: -0.5, y1: data.length - 0.5,
            line: { color: "#d9d9dd", width: 2, dash: "dot" },
          },
        ],
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", height: "400px" }}
      useResizeHandler
    />
  );
}
