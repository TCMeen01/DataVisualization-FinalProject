"use client";
/**
 * frontend/app/trend/page.tsx
 * RO5: Trend Analysis — Year-over-Year and Long-term Patterns
 * Charts: E1 (YoY line), E2 (Monthly heatmap), E3 (Rolling average)
 */
import { useEffect, useState } from "react";
import { YoYLineChart } from "@/components/charts/YoYLineChart";
import { HeatmapChart } from "@/components/charts/HeatmapChart";
import { RollingAverageChart } from "@/components/charts/RollingAverageChart";
import { NEUTRAL_COLORS } from "@/lib/constants";

export default function TrendPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/data/trend`);
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
            Xu Hướng Năm Qua Năm
          </h1>
          <p className="mt-2 text-sm" style={{ color: NEUTRAL_COLORS.text_muted }}>
            Phân tích xu hướng dài hạn PM2.5 từ 2024-2026
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-6">
          {/* E1: Year-over-Year Line Chart */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              E1: So Sánh Năm Nay với Năm Trước
            </h2>
            {data.e1_yoy ? (
              <YoYLineChart
                data={data.e1_yoy}
                title="PM2.5 Year-over-Year Comparison (2024-2026)"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>

          {/* E2: Monthly Anomaly Heatmap */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              E2: Bản Đồ Nhiệt Bất Thường Hàng Tháng
            </h2>
            {data.e2_monthly_heatmap ? (
              <HeatmapChart
                data={data.e2_monthly_heatmap}
                title="Monthly PM2.5 Anomalies"
                xaxis="Month"
                yaxis="Year"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>

          {/* E3: Rolling Average */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              E3: Trung Bình Động (7 Ngày, 30 Ngày)
            </h2>
            {data.e3_rolling_average ? (
              <RollingAverageChart
                data={data.e3_rolling_average}
                title="PM2.5 Rolling Average Trend"
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
