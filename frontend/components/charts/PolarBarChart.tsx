"use client";
/**
 * Chart C1 — Polar/Radial Bar (Plotly)
 * PM2.5 trung bình theo 24 giờ
 */
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface PolarBarChartProps {
  data: Array<{ hour: number | string; pm25: number }>;
  title?: string;
}

export function PolarBarChart({ data, title }: PolarBarChartProps) {
  const hours = data.map(d => d.hour);
  const values = data.map(d => d.pm25);
  const colors = values.map(v => {
    if (v < 12) return "#00e400";
    if (v < 35.4) return "#ffff00";
    if (v < 55.4) return "#ff7e00";
    if (v < 150.4) return "#ff0000";
    if (v < 250.4) return "#8f3f97";
    return "#7e0023";
  });

  return (
    <Plot
      data={[
        {
          r: values,
          theta: hours,
          type: "barpolar" as const,
          marker: { color: colors },
          hovertemplate: "Giờ: %{theta}<br>PM2.5: %{r:.1f} µg/m³<extra></extra>",
        },
      ]}
      layout={{
        title: title || "PM2.5 theo 24 giờ (Polar)",
        polar: {
          radialaxis: {
            visible: true,
            range: [0, Math.max(...values) * 1.1],
          },
        },
        margin: { l: 60, r: 60, t: 60, b: 60 },
        paper_bgcolor: "#ffffff",
      }}
      style={{ width: "100%", height: "400px" }}
    />
  );
}
