"use client";
/**
 * Interaction Page — RO4: Interaction paradox analysis.
 * Charts: E1 BoxPlotly (engagement by duration×tier), E2 HeatmapPlotly (day×hour views).
 */
import { useEffect, useState } from "react";
import { api, type InteractionData } from "@/lib/api";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { BoxPlotly } from "@/components/charts/BoxPlotly";
import { HeatmapPlotly } from "@/components/charts/HeatmapPlotly";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CHART_PALETTE, labelCategory, labelDuration, labelSubscriberTier } from "@/lib/constants";
import { COLORS, TEXT_COLORS, BG_COLORS, BORDER_COLORS } from "@/lib/design-tokens";

export default function InteractionPage() {
  const [data, setData] = useState<InteractionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [durationGroup, setDurationGroup] = useState<string | null>("All");

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .interaction({
          categories: selectedCategories.length > 0 ? selectedCategories.join(",") : undefined,
          duration_group: durationGroup === "All" || durationGroup === null ? undefined : durationGroup,
        })
        .then(setData)
        .catch((err) => console.error("Failed to load interaction data:", err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCategories, durationGroup]);

  const handleReset = () => {
    setSelectedCategories([]);
    setDurationGroup("All");
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Danh mục:</label>
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className="px-2 py-1 text-xs rounded transition-colors"
                style={{
                  background: selectedCategories.includes(cat) ? COLORS.actionBlue : COLORS.cardBorder,
                  color: selectedCategories.includes(cat) ? COLORS.canvas : COLORS.slate,
                  border: "1px solid",
                  borderColor: selectedCategories.includes(cat) ? COLORS.actionBlue : COLORS.hairline,
                }}
              >
                {labelCategory(cat)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Độ dài:</label>
          <Select value={durationGroup} onValueChange={setDurationGroup}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              <SelectItem value="Short">Ngắn</SelectItem>
              <SelectItem value="Medium">Trung bình</SelectItem>
              <SelectItem value="Long">Dài</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO4</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>
            Nghịch lý tương tác
          </h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            Phân tích tỉ lệ tương tác và thời điểm đăng video tối ưu.
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
                title="E1: Tỉ lệ tương tác theo độ dài × nhóm kênh"
                description="Biểu đồ hộp với 3 nhóm người đăng ký"
              >
                <BoxPlotly
                  traces={data.e1_box.map((item, index) => ({
                    name: `${labelDuration(item.label)} (${labelSubscriberTier(item.tier)})`,
                    y: item.values,
                    color:
                      item.tier === "Mega"
                        ? CHART_PALETTE[3]
                        : item.tier === "Large"
                        ? CHART_PALETTE[2]
                        : CHART_PALETTE[6],
                  }))}
                  yLabel="Tỉ lệ tương tác"
                  height={340}
                />
              </ChartCard>

              <ChartCard
                title="E2: Lượt xem theo ngày × giờ đăng"
                description="Bản đồ nhiệt 7×24, giờ vàng 11h–12h"
              >
                <HeatmapPlotly
                  z={data.e2_heatmap.z}
                  x={data.e2_heatmap.hours.map(String)}
                  y={data.e2_heatmap.days}
                  colorscale="Greens"
                  xLabel="Giờ đăng (GMT+7)"
                  yLabel="Ngày trong tuần"
                  height={340}
                />
              </ChartCard>
            </div>

            <InsightCard
              content="Giờ vàng 11h–12h trưa. Trò chơi có tỉ lệ tương tác cao nhất (1.88%) dù tỉ lệ video ngắn thấp. Kiểm định nhóm trung bình > nhóm siêu lớn về tỉ lệ tương tác?"
            />
          </>
        )}
      </div>
    </div>
  );
}
