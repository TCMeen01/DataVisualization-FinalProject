"use client";
/**
 * BoxPlotly — dynamic-imported Plotly box plot.
 * Used for: Chart C1 (view/video by category), Chart E1 (engagement by duration×tier).
 * SSR disabled via next/dynamic.
 */
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as React.ComponentType<PlotParams>;

interface BoxTrace {
  name: string;
  y: number[];
  color?: string;
}

interface BoxPlotlyProps {
  traces: BoxTrace[];
  title?: string;
  yLabel?: string;
  height?: number;
}

export function BoxPlotly({ traces, yLabel, height = 320 }: BoxPlotlyProps) {
  return (
    <Plot
      data={traces.map((t) => ({
        type: "box",
        name: t.name,
        y: t.y,
        boxmean: true,
        marker: { color: t.color ?? "#1863dc", opacity: 0.8 },
        line: { color: t.color ?? "#1863dc" },
        fillcolor: t.color ? `${t.color}30` : "#1863dc30",
      } as Plotly.Data))}
      layout={{
        paper_bgcolor: "#ffffff",
        plot_bgcolor: "#f9fafb",
        height,
        margin: { t: 8, r: 8, b: 60, l: 60 },
        font: { family: "Inter, Arial, sans-serif", size: 12, color: "#212121" },
        showlegend: false,
        xaxis: {
          showgrid: false,
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
