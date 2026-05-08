"use client";
/**
 * Channels Page — RO2: Channel growth analysis.
 * Charts: C1 BoxPlotly (view/video by category), C2 ScatterPlotly (subscriber vs avg_views).
 */
import { useEffect, useState } from "react";
import { api, type ChannelsData } from "@/lib/api";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { BoxPlotly } from "@/components/charts/BoxPlotly";
import { ScatterPlotly } from "@/components/charts/ScatterPlotly";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CATEGORY_COLORS, CHART_PALETTE, labelCategory } from "@/lib/constants";
import { TEXT_COLORS } from "@/lib/design-tokens";

export default function ChannelsPage() {
  const [data, setData] = useState<ChannelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>("All");
  const [tier, setTier] = useState<string | null>("All");

  // Insight state
  const [insight, setInsight] = useState<string>("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string>("");

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .channels({
          category: category === "All" || category === null ? undefined : category,
          tier: tier === "All" || tier === null ? undefined : tier,
        })
        .then(setData)
        .catch((err) => console.error("Failed to load channels data:", err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [category, tier]);

  const resetInsight = () => {
    setInsight("");
    setInsightError("");
  };

  const setCategoryFilter = (value: string | null) => {
    setCategory(value);
    resetInsight();
  };

  const setTierFilter = (value: string | null) => {
    setTier(value);
    resetInsight();
  };

  const calculateSummary = (data: ChannelsData) => {
    const avgViewsByCategory: Record<string, number> = {};
    data.c1_box.forEach((item) => {
      const avg = item.values.reduce((a, b) => a + b, 0) / item.values.length;
      avgViewsByCategory[item.category] = avg;
    });

    const tierDistribution: Record<string, number> = {};
    data.c2_scatter.forEach((ch) => {
      const subs = ch.subscriber_count;
      let tier = "Micro";
      if (subs >= 10000000) tier = "Mega";
      else if (subs >= 1000000) tier = "Large";
      else if (subs >= 100000) tier = "Mid";
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
    });

    return {
      total_channels: data.c2_scatter.length,
      avg_views_by_category: avgViewsByCategory,
      subscriber_tier_distribution: tierDistribution,
    };
  };

  const handleGetInsight = async () => {
    if (!data) return;

    setInsightLoading(true);
    setInsightError("");

    try {
      const summary = calculateSummary(data);
      const filters = {
        category: category === "All" ? null : category,
        tier: tier === "All" ? null : tier,
      };

      const response = await api.generateInsight({
        page: "channels",
        filters,
        summary,
      });

      setInsight(response.insight);
    } catch (error) {
      setInsightError(
        error instanceof Error ? error.message : "Không thể tạo insight. Vui lòng thử lại."
      );
    } finally {
      setInsightLoading(false);
    }
  };

  const handleReset = () => {
    setCategory("All");
    setTier("All");
    resetInsight();
  };

  return (
    <div className="flex flex-col h-full">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Danh mục:</label>
          <Select value={category} onValueChange={setCategoryFilter}>
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

        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Nhóm người đăng ký:</label>
          <Select value={tier} onValueChange={setTierFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              <SelectItem value="Micro">Siêu nhỏ (&lt;100N)</SelectItem>
              <SelectItem value="Mid">Trung bình (100N–1Tr)</SelectItem>
              <SelectItem value="Large">Lớn (1Tr–10Tr)</SelectItem>
              <SelectItem value="Mega">Siêu lớn (&gt;10Tr)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO2</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>
            Tăng trưởng kênh
          </h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            Phân tích lượt xem trung bình và người đăng ký theo danh mục kênh.
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
                title="C1: Phân bố lượt xem/video theo danh mục"
                description="Biểu đồ hộp với trung vị và điểm ngoại lệ"
              >
                <BoxPlotly
                  traces={data.c1_box.map((item) => ({
                    name: labelCategory(item.category),
                    y: item.values,
                    color: CATEGORY_COLORS[item.category],
                  }))}
                  yLabel="Lượt xem/video"
                  height={340}
                />
              </ChartCard>

              <ChartCard
                title="C2: Người đăng ký và lượt xem trung bình"
                description="Biểu đồ phân tán"
              >
                <ScatterPlotly
                  traces={data.c2_scatter.reduce((acc, point) => {
                    const existing = acc.find((t) => t.name === labelCategory(point.category));
                    if (existing) {
                      existing.x.push(point.subscriber_count);
                      existing.y.push(point.avg_views);
                      existing.text?.push(point.channel_name);
                    } else {
                      acc.push({
                        name: labelCategory(point.category),
                        x: [point.subscriber_count],
                        y: [point.avg_views],
                        text: [point.channel_name],
                        marker: {
                          size: 10,
                          color: CATEGORY_COLORS[point.category] ?? CHART_PALETTE[0],
                          opacity: 0.7,
                        },
                      });
                    }
                    return acc;
                  }, [] as { name: string; x: number[]; y: number[]; text: string[]; marker: { size: number; color: string; opacity: number } }[])}
                  xAxisType="log"
                  xLabel="Số người đăng ký (thang log)"
                  yLabel="Lượt xem trung bình mỗi video"
                  height={340}
                />
              </ChartCard>
            </div>

            <InsightCard
              content={insight}
              loading={insightLoading}
              error={insightError}
              onGetInsight={handleGetInsight}
            />
          </>
        )}
      </div>
    </div>
  );
}
