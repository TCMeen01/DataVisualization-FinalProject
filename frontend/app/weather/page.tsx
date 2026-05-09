"use client";
/**
 * frontend/app/weather/page.tsx
 * RO3: Tác Động Thời Tiết — "Thời tiết nào thực sự giải cứu không khí?"
 *
 * Charts theo REQUIREMENTS.md §3.5:
 * - D1: Correlation Bar Chart (hệ số Pearson r của 5 biến thời tiết với PM2.5)
 * - D2: Scatter PM2.5 vs Tốc độ gió (color = season, trend line + r)
 * - D3: Dual-Axis Line PM2.5 & Tốc độ gió theo ngày
 *
 * Filter: Multi-select season
 * InsightCard: "Chỉ có gió mới có tác dụng phân tán PM2.5..."
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { CorrelationBarChart } from "@/components/charts/CorrelationBarChart";
import { ScatterChart } from "@/components/charts/ScatterChart";
import { DualAxisChart } from "@/components/charts/DualAxisChart";
import { ChartCard } from "@/components/charts/ChartCard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { FilterBar } from "@/components/dashboard/FilterBar";
import {
  NEUTRAL_COLORS,
  SEASON_COLORS,
  SEASON_LABELS,
  labelCategory,
} from "@/lib/constants";
import { TEXT_COLORS } from "@/lib/design-tokens";
import { api } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────────

interface CorrelationItem {
  variable: string;
  label: string;
  correlation: number;
  annotation?: string;
}

interface WindScatterPoint {
  season: string;
  wind_speed: number;
  pm25: number;
}

interface DualAxisPoint {
  date: string;
  pm25: number;
  wind_speed: number;
}

interface WeatherData {
  d1_correlation: CorrelationItem[];
  d2_wind_scatter: WindScatterPoint[];
  d2_season_corr: Record<string, number>;
  d3_dual_axis: DualAxisPoint[];
  insight: {
    wind_corr: number;
    humidity_corr: number;
  };
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function WeatherPage() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state: multi-select seasons
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);

  // Insight state
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  // Fetch data (debounced by season filter)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWeatherData();
    }, 300); // 300ms debounce per REQUIREMENTS §3.8
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeasons]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const seasonParam = selectedSeasons.length > 0
        ? `?season=${encodeURIComponent(selectedSeasons.join(","))}`
        : "";
      const response = await fetch(`${API_BASE}/api/data/weather${seasonParam}`);
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

  // Season filter toggle
  const toggleSeason = useCallback((season: string) => {
    setSelectedSeasons(prev =>
      prev.includes(season)
        ? prev.filter(s => s !== season)
        : [...prev, season]
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedSeasons([]);
  }, []);

  // Prepare D2 scatter data for the ScatterChart component
  const scatterData = useMemo(() => {
    if (!data?.d2_wind_scatter) return [];
    return data.d2_wind_scatter.map(d => ({
      x: d.wind_speed,
      y: d.pm25,
      group: d.season,
    }));
  }, [data]);

  // Overall wind correlation text
  const windCorrText = useMemo(() => {
    if (!data?.insight) return "";
    const r = data.insight.wind_corr;
    return `r = ${r.toFixed(3)}`;
  }, [data]);

  // Handle insight generation
  const handleGetInsight = async () => {
    if (!data) return;
    setInsightLoading(true);
    setInsightError("");

    try {
      const response = await api.generateInsight({
        page: "weather",
        filters: { seasons: selectedSeasons },
        summary: {
          wind_corr: data.insight.wind_corr,
          humidity_corr: data.insight.humidity_corr,
          season_corr: data.d2_season_corr,
          correlations: data.d1_correlation,
        },
      });
      setInsight(response.insight);
    } catch (err) {
      // Fallback to static insight from REQUIREMENTS.md §3.9
      setInsight(
        "Chỉ có gió mới có tác dụng phân tán PM2.5. Mưa phùn Hà Nội quá nhẹ để rửa hạt bụi micro. " +
        "Áp suất cao → không khí tĩnh → ô nhiễm tích tụ."
      );
    } finally {
      setInsightLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: NEUTRAL_COLORS.canvas }}>
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium mb-2">Không thể tải dữ liệu</p>
          <p className="text-sm" style={{ color: NEUTRAL_COLORS.text_muted }}>{error}</p>
          <button
            onClick={fetchWeatherData}
            className="mt-4 px-4 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: "#1863dc" }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 py-12">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>
          RO3 • Tác Động Thời Tiết
        </p>
        <h1
          className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}
          style={{ fontFamily: "var(--font-display, 'Space Grotesk', Inter, sans-serif)" }}
        >
          Thời tiết nào thực sự &quot;giải cứu&quot; không khí?
        </h1>
        <p className={`mt-3 max-w-3xl ${TEXT_COLORS.slate}`}>
          So sánh tương quan của từng biến thời tiết (nhiệt độ, độ ẩm, tốc độ gió, áp suất, lượng mưa)
          với PM2.5. Mục tiêu: chứng minh <strong>chỉ có gió mới có tác dụng giảm ô nhiễm đáng kể</strong>,
          còn mưa và độ ẩm gần như không có tác động.
        </p>
      </header>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <FilterBar onReset={selectedSeasons.length > 0 ? resetFilters : undefined}>
        <span className="text-sm font-medium" style={{ color: "#212121" }}>Mùa:</span>
        {SEASON_LABELS.map(season => {
          const isActive = selectedSeasons.includes(season);
          return (
            <button
              key={season}
              onClick={() => toggleSeason(season)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: isActive
                  ? SEASON_COLORS[season as keyof typeof SEASON_COLORS]
                  : "#f5f5f7",
                color: isActive ? "#ffffff" : "#75758a",
                border: isActive
                  ? `2px solid ${SEASON_COLORS[season as keyof typeof SEASON_COLORS]}`
                  : "2px solid #e5e7eb",
                transform: isActive ? "scale(1.05)" : "scale(1)",
              }}
            >
              {labelCategory(season)}
            </button>
          );
        })}
      </FilterBar>

      {/* Loading state */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#10b981] border-t-transparent" />
            <span className={TEXT_COLORS.muted}>Đang tải dữ liệu...</span>
          </div>
        </div>
      )}

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      {data && (
        <>
          {/* Active filter badges */}
          {selectedSeasons.length > 0 && (
            <div className="mt-4 mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium" style={{ color: "#75758a" }}>Đang lọc:</span>
              {selectedSeasons.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-white"
                  style={{ background: SEASON_COLORS[s as keyof typeof SEASON_COLORS] }}
                >
                  {labelCategory(s)}
                  <button
                    onClick={() => toggleSeason(s)}
                    className="ml-1 hover:opacity-70"
                    aria-label={`Xóa bộ lọc ${labelCategory(s)}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── D1: Correlation Bar Chart ─────────────────────────────── */}
            <ChartCard
              title="D1: Tương Quan Biến Thời Tiết với PM2.5"
              description="Hệ số Pearson r — Xanh: giảm ô nhiễm, Đỏ: tăng ô nhiễm, Xám: không ảnh hưởng"
              loading={loading}
            >
              {data.d1_correlation && data.d1_correlation.length > 0 ? (
                <CorrelationBarChart
                  data={data.d1_correlation}
                  title=""
                />
              ) : (
                <div className="flex items-center justify-center h-[400px]" style={{ color: NEUTRAL_COLORS.text_muted }}>
                  Không có dữ liệu tương quan
                </div>
              )}
            </ChartCard>

            {/* ── D2: Scatter PM2.5 vs Tốc độ gió ──────────────────────── */}
            <ChartCard
              title="D2: PM2.5 vs Tốc độ Gió theo Mùa"
              description={`Gió mạnh → PM2.5 giảm • Tương quan tổng: ${windCorrText}`}
              loading={loading}
            >
              {scatterData.length > 0 ? (
                <ScatterChart
                  data={scatterData}
                  xLabel="Tốc độ gió (m/s)"
                  yLabel="PM2.5 (µg/m³)"
                  title=""
                  groupColors={SEASON_COLORS}
                />
              ) : (
                <div className="flex items-center justify-center h-[400px]" style={{ color: NEUTRAL_COLORS.text_muted }}>
                  Không có dữ liệu scatter
                </div>
              )}
            </ChartCard>

            {/* ── D3: Dual-Axis PM2.5 & Tốc độ gió ─────────────────────── */}
            <ChartCard
              title="D3: PM2.5 & Tốc độ Gió Theo Ngày (Trục Kép)"
              description="Đường đỏ: PM2.5 (trục trái) • Đường xanh: Tốc độ gió (trục phải) — Đỉnh gió trùng đáy PM2.5"
              className="lg:col-span-2"
              loading={loading}
            >
              {data.d3_dual_axis && data.d3_dual_axis.length > 0 ? (
                <DualAxisChart
                  data={data.d3_dual_axis}
                  title=""
                />
              ) : (
                <div className="flex items-center justify-center h-[450px]" style={{ color: NEUTRAL_COLORS.text_muted }}>
                  Không có dữ liệu dual-axis
                </div>
              )}
            </ChartCard>
          </div>

          {/* ── Season Correlation Summary ─────────────────────────────── */}
          {data.d2_season_corr && Object.keys(data.d2_season_corr).length > 0 && (
            <div className="mt-6 bg-white border border-[#f2f2f2] rounded-[8px] p-6">
              <h3
                className="text-base font-semibold text-[#212121] mb-4"
                style={{ fontFamily: "var(--font-display, 'Space Grotesk', Inter, sans-serif)" }}
              >
                Tương quan Gió–PM2.5 theo mùa
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.d2_season_corr)
                  .sort(([a], [b]) => SEASON_LABELS.indexOf(a as any) - SEASON_LABELS.indexOf(b as any))
                  .map(([season, r]) => (
                    <div
                      key={season}
                      className="rounded-lg p-4 text-center transition-transform duration-200 hover:scale-105"
                      style={{
                        background: `${SEASON_COLORS[season as keyof typeof SEASON_COLORS]}15`,
                        border: `1px solid ${SEASON_COLORS[season as keyof typeof SEASON_COLORS]}30`,
                      }}
                    >
                      <p className="text-sm font-medium" style={{ color: SEASON_COLORS[season as keyof typeof SEASON_COLORS] }}>
                        {labelCategory(season)}
                      </p>
                      <p
                        className="text-2xl font-bold mt-1"
                        style={{
                          color: r < 0 ? "#10b981" : "#ef4444",
                          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        }}
                      >
                        {(r as number).toFixed(3)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#93939f" }}>
                        {r < -0.15 ? "Ảnh hưởng rõ" : r < -0.05 ? "Ảnh hưởng nhẹ" : "Không đáng kể"}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── InsightCard — RO3 ──────────────────────────────────────── */}
          <div className="mt-6">
            <InsightCard
              title="💨 RO3 — Yếu tố thời tiết và PM2.5"
              content={insight}
              loading={insightLoading}
              error={insightError}
              onGetInsight={handleGetInsight}
            />
          </div>
        </>
      )}
    </div>
  );
}
