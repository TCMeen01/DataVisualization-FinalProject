"use client";
/**
 * Chart D3 — Dual-Axis Line (Plotly)
 * PM2.5 + Tốc độ gió theo ngày
 */
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface DualAxisChartProps {
  data: Array<{ date: string; pm25: number; value2: number }>;
  label1?: string;
  label2?: string;
  title?: string;
  color1?: string;
  color2?: string;
}

export function DualAxisChart({
  data,
  label1 = "PM2.5",
  label2 = "Value 2",
  title = "Dual Axis",
  color1 = "#ff7e00",
  color2 = "#1f77b4",
}: DualAxisChartProps) {
  return (
    <Plot
      data={[
        {
          x: data.map(d => d.date),
          y: data.map(d => d.pm25),
          type: "scatter" as const,
          mode: "lines" as const,
          name: label1,
          line: { color: color1 },
          yaxis: "y",
        },
        {
          x: data.map(d => d.date),
          y: data.map(d => d.value2),
          type: "scatter" as const,
          mode: "lines" as const,
          name: label2,
          line: { color: color2 },
          yaxis: "y2",
        },
      ]}
      layout={{
        title,
        xaxis: { title: "Ngày" },
        yaxis: { title: label1, titlefont: { color: color1 } },
        yaxis2: {
          title: label2,
          titlefont: { color: color2 },
          overlaying: "y",
          side: "right",
        },
        margin: { l: 80, r: 80, t: 60, b: 60 },
        plot_bgcolor: "#ffffff",
        paper_bgcolor: "#ffffff",
        hovermode: "x unified",
      }}
      style={{ width: "100%", height: "400px" }}
    />
  );
}
