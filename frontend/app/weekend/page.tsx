"use client";
/**
 * frontend/app/weekend/page.tsx
 * RO6: Weekend vs Weekday — Comparative Analysis of PM2.5 Patterns
 * Charts: F1 (Box plot), F2 (Grouped bar), F3 (Line comparison)
 */
import { useEffect, useState } from "react";
import { BoxPlotChart } from "@/components/charts/BoxPlotChart";
import { GroupedBarChart } from "@/components/charts/GroupedBarChart";
import { LineComparisonChart } from "@/components/charts/LineComparisonChart";
import { NEUTRAL_COLORS } from "@/lib/constants";

export default function WeekendPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/data/weekend`);
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
            Cuối Tuần vs Ngày Thường
          </h1>
          <p className="mt-2 text-sm" style={{ color: NEUTRAL_COLORS.text_muted }}>
            So sánh mô hình PM2.5 giữa ngày thường và cuối tuần
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* F1: Box Plot Distribution */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              F1: Phân Bố PM2.5 Theo Loại Ngày
            </h2>
            {data.f1_box ? (
              <BoxPlotChart
                data={data.f1_box}
                title="PM2.5 Distribution: Weekday vs Weekend"
                yaxis="PM2.5 (µg/m³)"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>

          {/* F2: Grouped Bar Chart */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              F2: PM2.5 Theo Giờ × Loại Ngày
            </h2>
            {data.f2_grouped_bar ? (
              <GroupedBarChart
                data={data.f2_grouped_bar}
                title="PM2.5 by Hour & Day Type"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>

          {/* F3: Line Comparison (full width) */}
          <div
            className="rounded-lg border p-6 lg:col-span-2"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              F3: So Sánh Hồ Sơ 24 Giờ
            </h2>
            {data.f3_line_comparison ? (
              <LineComparisonChart
                data={data.f3_line_comparison}
                title="24-Hour PM2.5 Profile Comparison"
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
