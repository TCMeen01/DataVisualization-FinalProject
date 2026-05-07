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
import { CATEGORIES, SUBSCRIBER_TIERS, CATEGORY_COLORS } from "@/lib/constants";

export default function ChannelsPage() {
  const [data, setData] = useState<ChannelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>("All");
  const [tier, setTier] = useState<string | null>("All");

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

  const handleReset = () => {
    setCategory("All");
    setTier("All");
  };

  return (
    <div className="flex flex-col h-full">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#75758a]">Danh mục:</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-[#75758a]">Tier:</label>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              {SUBSCRIBER_TIERS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#93939f]">RO2</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#212121]">
            Tăng Trưởng Kênh
          </h1>
          <p className="mt-3 max-w-2xl text-[#75758a]">
            Phân tích lượt xem trung bình và subscriber theo danh mục kênh.
          </p>
        </header>

        {loading ? (
          <p className="text-[#93939f]">Đang tải dữ liệu...</p>
        ) : !data ? (
          <p className="text-[#93939f]">Không thể tải dữ liệu. Kiểm tra backend.</p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard
                title="C1: Phân bố lượt xem/video theo danh mục"
                description="Box plot với median và outliers"
              >
                <BoxPlotly
                  traces={data.c1_box.map((item) => ({
                    name: item.category,
                    y: item.values,
                    color: CATEGORY_COLORS[item.category],
                  }))}
                  yLabel="Lượt xem/video"
                  height={340}
                />
              </ChartCard>

              <ChartCard
                title="C2: Subscriber vs Avg Views"
                description="Scatter plot, size = video count"
              >
                <ScatterPlotly
                  traces={data.c2_scatter.reduce((acc, point) => {
                    const existing = acc.find((t) => t.name === point.category);
                    if (existing) {
                      existing.x.push(point.subscriber_count);
                      existing.y.push(point.avg_views);
                      existing.text?.push(point.channel_name);
                      existing.marker?.size?.push(Math.sqrt(point.video_count) * 2);
                    } else {
                      acc.push({
                        name: point.category,
                        x: [point.subscriber_count],
                        y: [point.avg_views],
                        text: [point.channel_name],
                        marker: {
                          size: [Math.sqrt(point.video_count) * 2],
                          color: CATEGORY_COLORS[point.category] ?? "#1863dc",
                          opacity: 0.7,
                        },
                      });
                    }
                    return acc;
                  }, [] as { name: string; x: number[]; y: number[]; text: string[]; marker: { size: number[]; color: string; opacity: number } }[])}
                  xAxisType="log"
                  xLabel="Subscriber count (log scale)"
                  yLabel="Avg views per video"
                  height={340}
                />
              </ChartCard>
            </div>

            <InsightCard
              content="Kids có median view thấp nhưng outlier cực cao — vài video viral kéo cả kênh. Mega không phải luôn đứng đầu avg view."
            />
          </>
        )}
      </div>
    </div>
  );
}
