"use client";
/**
 * Anomaly Page — RO3: Anomaly detection and viral video analysis.
 * Charts: D1 ScatterPlotly (view vs like_view_ratio with suspect flag), D2 TopVideosTable (top 15 viral).
 */
import { useEffect, useState } from "react";
import { api, type AnomalyData } from "@/lib/api";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { ScatterPlotly } from "@/components/charts/ScatterPlotly";
import { TopVideosTable } from "@/components/charts/TopVideosTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export default function AnomalyPage() {
  const [data, setData] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [channelId, setChannelId] = useState<string | null>("All");
  const [yearRange, setYearRange] = useState<number[]>([2015, 2026]);
  const [channels, setChannels] = useState<string[]>([]);

  // Load channel list on mount
  useEffect(() => {
    api
      .channels()
      .then((res) => {
        const names = res.c2_scatter.map((c) => c.channel_name).sort();
        setChannels(names);
      })
      .catch((err) => console.error("Failed to load channels:", err));
  }, []);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .anomaly({
          channel_id: channelId === "All" || channelId === null ? undefined : channelId,
          year_from: yearRange[0],
          year_to: yearRange[1],
        })
        .then(setData)
        .catch((err) => console.error("Failed to load anomaly data:", err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [channelId, yearRange]);

  const handleReset = () => {
    setChannelId("All");
    setYearRange([2015, 2026]);
  };

  return (
    <div className="flex flex-col h-full">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#75758a]">Kênh:</label>
          <Select value={channelId} onValueChange={setChannelId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              {channels.map((ch) => (
                <SelectItem key={ch} value={ch}>
                  {ch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-[#75758a] whitespace-nowrap">Năm:</label>
          <div className="w-48">
            <Slider
              value={yearRange}
              onValueChange={(val) => setYearRange(val as number[])}
              min={2015}
              max={2026}
              step={1}
            />
          </div>
          <span className="text-xs text-[#93939f] tabular-nums">
            {yearRange[0]} – {yearRange[1]}
          </span>
        </div>
      </FilterBar>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#93939f]">RO3</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#212121]">
            Bất Thường & Viral
          </h1>
          <p className="mt-3 max-w-2xl text-[#75758a]">
            Phát hiện video có dấu hiệu bất thường và phân tích video viral.
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
                title="D1: View count vs Like/View ratio"
                description="Màu đỏ/cam = nghi ngờ fake view"
              >
                <ScatterPlotly
                  traces={[
                    {
                      name: "Bình thường",
                      x: data.d1_scatter.filter((p) => !p.suspect_fake_view).map((p) => p.view_count),
                      y: data.d1_scatter.filter((p) => !p.suspect_fake_view).map((p) => p.like_view_ratio),
                      text: data.d1_scatter.filter((p) => !p.suspect_fake_view).map((p) => p.title),
                      marker: { color: "#1863dc", opacity: 0.6 },
                    },
                    {
                      name: "Nghi ngờ",
                      x: data.d1_scatter.filter((p) => p.suspect_fake_view).map((p) => p.view_count),
                      y: data.d1_scatter.filter((p) => p.suspect_fake_view).map((p) => p.like_view_ratio),
                      text: data.d1_scatter.filter((p) => p.suspect_fake_view).map((p) => p.title),
                      marker: { color: "#ff7759", opacity: 0.75 },
                    },
                  ]}
                  xAxisType="log"
                  xLabel="View count (log scale)"
                  yLabel="Like/View ratio"
                  height={340}
                />
              </ChartCard>

              <ChartCard
                title="D2: Top 15 video viral"
                description="Sắp xếp theo lượt xem giảm dần"
              >
                <TopVideosTable data={data.d2_viral} />
              </ChartCard>
            </div>

            <InsightCard
              content="Top viral: FLife TV 620M views. Music & Kids chiếm áp đảo viral count (123 + 138). Một số video view rất cao nhưng like_view_ratio bất thường thấp."
            />
          </>
        )}
      </div>
    </div>
  );
}
