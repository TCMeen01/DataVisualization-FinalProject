"use client";
/**
 * frontend/app/weather/page.tsx
 * RO4: Weather Impact — Correlation with PM2.5 and Environmental Conditions
 * Charts: D1 (Correlation bar), D2 (Seasonal scatter), D3 (Dual-axis)
 */
import { useEffect, useState } from "react";
import { CorrelationBarChart } from "@/components/charts/CorrelationBarChart";
import { ScatterChart } from "@/components/charts/ScatterChart";
import { DualAxisChart } from "@/components/charts/DualAxisChart";
import { NEUTRAL_COLORS } from "@/lib/constants";

export default function WeatherPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/data/weather`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: NEUTRAL_COLORS.canvas }}>
        <div className="text-lg" style={{ color: NEUTRAL_COLORS.text_muted }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: NEUTRAL_COLORS.canvas }}>
        <div className="text-red-600">Lỗi: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: NEUTRAL_COLORS.canvas }}>
        <div className="text-lg" style={{ color: NEUTRAL_COLORS.text_muted }}>
          Không có dữ liệu
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: NEUTRAL_COLORS.canvas, minHeight: "100vh" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: NEUTRAL_COLORS.border_hairline, background: NEUTRAL_COLORS.canvas }}>
        <div className="px-6 py-8 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold" style={{ color: NEUTRAL_COLORS.text_dark }}>
            Tác Động Thời Tiết
          </h1>
          <p className="mt-2 text-sm" style={{ color: NEUTRAL_COLORS.text_muted }}>
            Mối liên hệ giữa các yếu tố thời tiết và PM2.5
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* D1: Weather Correlation */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              D1: Tương Quan Với PM2.5
            </h2>
            {data.d1_correlation ? (
              <CorrelationBarChart
                data={data.d1_correlation}
                title="Weather Variable Correlations"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>

          {/* D2: Seasonal Weather Scatter */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              D2: Nhiệt Độ vs PM2.5 Theo Mùa
            </h2>
            {data.d2_seasonal_scatter ? (
              <ScatterChart
                data={data.d2_seasonal_scatter}
                xField="temperature"
                yField="pm25"
                colorField="season"
                title="Temperature vs PM2.5 by Season"
                xlabel="Nhiệt độ (°C)"
                ylabel="PM2.5 (µg/m³)"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>

          {/* D3: Dual-Axis (PM2.5 + Temperature) */}
          <div
            className="rounded-lg border p-6 lg:col-span-2"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              D3: PM2.5 + Nhiệt Độ (Trục Kép)
            </h2>
            {data.d3_dual_axis ? (
              <DualAxisChart
                data={data.d3_dual_axis}
                leftAxis="pm25"
                rightAxis="temperature"
                title="PM2.5 & Temperature Trends"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
