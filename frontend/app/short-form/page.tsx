"use client";
/**
 * Short-form Page — RO1: Short-form trend analysis.
 * Charts: B1 HeatmapPlotly (channel×year short_form_ratio), B2 StackedBarChart (short vs long by year).
 */
import { useEffect, useState } from "react";
import { api, type ShortFormData } from "@/lib/api";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { HeatmapPlotly } from "@/components/charts/HeatmapPlotly";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CHART_PALETTE, labelCategory } from "@/lib/constants";
import { TEXT_COLORS } from "@/lib/design-tokens";

export default function ShortFormPage() {
  const [data, setData] = useState<ShortFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearRange, setYearRange] = useState<number[]>([2015, 2026]);
  const [category, setCategory] = useState<string | null>("All");

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .shortForm({
          year_from: yearRange[0],
          year_to: yearRange[1],
          category: category === "All" || category === null ? undefined : category,
        })
        .then(setData)
        .catch((err) => console.error("Failed to load short-form data:", err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [yearRange, category]);

  const handleReset = () => {
    setYearRange([2015, 2026]);
    setCategory("All");
  };

  return (
    <div className="flex flex-col h-full">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate} whitespace-nowrap`}>Năm:</label>
          <div className="w-48">
            <Slider
              value={yearRange}
              onValueChange={(val) => setYearRange(val as number[])}
              min={2015}
              max={2026}
              step={1}
            />
          </div>
          <span className={`text-xs ${TEXT_COLORS.muted} tabular-nums`}>
            {yearRange[0]} – {yearRange[1]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Danh mục:</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {labelCategory(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO1</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>
            Xu hướng video ngắn
          </h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            Phân tích tỉ lệ video ngắn theo kênh và thời gian.
          </p>
        </header>

        {loading ? (
          <p className={TEXT_COLORS.muted}>Đang tải dữ liệu...</p>
        ) : !data ? (
          <p className={TEXT_COLORS.muted}>Không thể tải dữ liệu. Kiểm tra backend.</p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="B1: Tỉ lệ video ngắn theo kênh × năm"
                description="Bản đồ nhiệt: màu đậm = tỉ lệ cao"
              >
                <HeatmapPlotly
                  z={data.b1_heatmap.z}
                  x={data.b1_heatmap.years.map(String)}
                  y={data.b1_heatmap.channels}
                  colorscale="Greens"
                  xLabel="Năm"
                  yLabel="Kênh"
                  height={480}
                />
              </ChartCard>

              <ChartCard
                title="B2: Số lượng video ngắn và video dài theo năm"
                description="Biểu đồ cột chồng"
              >
                <StackedBarChart
                  data={data.b2_bar}
                  xKey="label"
                  bars={[
                    { key: "short", label: "Video ngắn", color: CHART_PALETTE[4] },
                    { key: "long", label: "Video dài", color: CHART_PALETTE[5] },
                  ]}
                />
              </ChartCard>
            </div>

            <InsightCard
              content="Hài có tỉ lệ video ngắn cao nhất (62.8%), Nhật ký đời sống thấp nhất (13.4%). Vài kênh xoay trục từ ~0% → ~90% chỉ trong 2 năm."
            />
          </>
        )}
      </div>
    </div>
  );
}
