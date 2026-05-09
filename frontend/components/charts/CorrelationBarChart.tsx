"use client";
/**
 * Chart D1 — Correlation Bar (Plotly)
 * Hệ số tương quan Pearson giữa các biến thời tiết và PM2.5
 */
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface CorrelationBarChartProps {
  data: Array<{ variable: string; correlation: number }>;
  title?: string;
}

export function CorrelationBarChart({ data, title }: CorrelationBarChartProps) {
  const correlations = data.map(d => d.correlation);
  const colors = correlations.map(c => (c < 0 ? "#00e400" : c > 0 ? "#ff0000" : "#999"));

  return (
    <Plot
      data={[
        {
          y: data.map(d => d.variable),
          x: correlations,
          type: "bar" as const,
          orientation: "h" as const,
          marker: { color: colors },
          hovertemplate: "%{y}<br>Tương quan: %{x:.3f}<extra></extra>",
        },
      ]}
      layout={{
        title: title || "Tương quan với PM2.5",
        xaxis: { title: "Hệ số Pearson (r)" },
        margin: { l: 120, r: 30, t: 60, b: 60 },
        plot_bgcolor: "#ffffff",
        paper_bgcolor: "#ffffff",
      }}
      style={{ width: "100%", height: "400px" }}
    />
  );
}
