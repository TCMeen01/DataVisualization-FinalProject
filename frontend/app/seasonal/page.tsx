"use client";
/**
 * frontend/app/seasonal/page.tsx
 * RO2: Seasonal Analysis — PM2.5 by Weather & Environmental Factors
 * Charts: B1 (Box plot), B2 (Humidity scatter), B3 (Pressure scatter)
 */
import { useEffect, useState } from "react";
import { BoxPlotChart } from "@/components/charts/BoxPlotChart";
import { ScatterChart } from "@/components/charts/ScatterChart";
import { NEUTRAL_COLORS } from "@/lib/constants";

export default function SeasonalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/data/seasonal`);
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
            Phân Tích Theo Mùa
          </h1>
          <p className="mt-2 text-sm" style={{ color: NEUTRAL_COLORS.text_muted }}>
            PM2.5 theo điều kiện thời tiết và các yếu tố môi trường
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* B1: Weather Box Plot */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              B1: PM2.5 Theo Loại Thời Tiết
            </h2>
            {data.b1_box ? (
              <BoxPlotChart
                data={data.b1_box}
                title="PM2.5 Distribution by Weather Type"
                yaxis="PM2.5 (µg/m³)"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>

          {/* B2: Humidity vs PM2.5 Scatter */}
          <div
            className="rounded-lg border p-6"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              B2: Độ Ẩm vs PM2.5
            </h2>
            {data.b2_humidity_scatter ? (
              <ScatterChart
                data={data.b2_humidity_scatter}
                xField="humidity"
                yField="pm25"
                colorField="aqi_category"
                title="Humidity vs PM2.5"
                xlabel="Độ Ẩm (%)"
                ylabel="PM2.5 (µg/m³)"
              />
            ) : (
              <div style={{ color: NEUTRAL_COLORS.text_muted }}>Không có dữ liệu</div>
            )}
          </div>

          {/* B3: Pressure vs PM2.5 Scatter (full width) */}
          <div
            className="rounded-lg border p-6 lg:col-span-2"
            style={{
              background: NEUTRAL_COLORS.surface,
              borderColor: NEUTRAL_COLORS.border_light,
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: NEUTRAL_COLORS.text_dark }}>
              B3: Áp Suất Khí Quyển vs PM2.5
            </h2>
            {data.b3_pressure_scatter ? (
              <ScatterChart
                data={data.b3_pressure_scatter}
                xField="pressure"
                yField="pm25"
                colorField="aqi_category"
                title="Pressure vs PM2.5"
                xlabel="Áp Suất (hPa)"
                ylabel="PM2.5 (µg/m³)"
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
