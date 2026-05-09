"use client";
/**
 * frontend/app/hourly/page.tsx
 * RO3: Hourly Patterns — PM2.5 Variation Throughout the Day
 * Charts: C1 (Polar), C2 (Heatmap), C3 (Stacked bar)
 */
import { useEffect, useState } from "react";
import { PolarBarChart } from "@/components/charts/PolarBarChart";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { NEUTRAL_COLORS } from "@/lib/constants";

export default function HourlyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/data/hourly`);
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
            Mô Hình Theo Giờ
          </h1>
          <p className="mt-2 text-sm" style={{ color: NEUTRAL_COLORS.text_muted }}>
            Sự thay đổi PM2.5 trong suốt cả ngày
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-6">
          {/* C1: Hourly Polar Chart */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              C1: PM2.5 Theo Giờ (Biểu Đồ Cực)
            </h2>
            {data.c1_hourly_polar ? (
              <PolarBarChart
                data={data.c1_hourly_polar}
                title="PM2.5 Distribution by Hour (24-hour)"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>

          {/* C2: Temperature Heatmap */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              C2: PM2.5 × Nhiệt Độ (Heatmap)
            </h2>
            {data.c2_temp_heatmap ? (
              <HeatmapChart
                data={data.c2_temp_heatmap}
                title="PM2.5 by Temperature & Hour"
                xaxis="Hour"
                yaxis="Temperature Range"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>

          {/* C3: AQI Stacked Bar */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              C3: Phân Bố AQI Theo Giờ (%)
            </h2>
            {data.c3_aqi_stacked ? (
              <StackedBarChart
                data={data.c3_aqi_stacked}
                title="AQI Distribution by Hour"
                xaxis="Hour"
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
