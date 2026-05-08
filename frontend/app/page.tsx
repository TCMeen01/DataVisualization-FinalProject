"use client";
/**
 * Overview Page — Dashboard home with 4 KPIs + 3 charts + cross-filter.
 * Charts: A1 PieDonut (category distribution), A2 LineChart (views by year), A3 StackedAreaChart (short vs long ratio).
 */
import { useEffect, useState } from "react";
import { api, type OverviewData } from "@/lib/api";
import { CategoryFilterProvider, useCategoryFilter } from "./CategoryFilterContext";
import { KPICard } from "@/components/dashboard/KPICard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { PieDonut } from "@/components/charts/PieDonut";
import { LineChart } from "@/components/charts/LineChart";
import { StackedAreaChart } from "@/components/charts/StackedAreaChart";
import { CHART_PALETTE, formatNumber } from "@/lib/constants";

function OverviewContent() {
  const { selectedCategory, setSelectedCategory } = useCategoryFilter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .overview(selectedCategory ?? undefined)
        .then(setData)
        .catch((err) => console.error("Failed to load overview:", err))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="px-10 py-12">
        <p className="text-[#93939f]">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-10 py-12">
        <p className="text-[#93939f]">Không thể tải dữ liệu. Kiểm tra backend.</p>
      </div>
    );
  }

  return (
    <div className="px-10 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#93939f]">Dashboard</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#212121]">
          Tổng Quan
        </h1>
        <p className="mt-3 max-w-3xl text-[#75758a] italic font-semibold">
          Dữ liệu được thu thập vào ngày 05/05/2026.
        </p>
        <p className="mt-3 max-w-3xl text-[#75758a]">
          Chỉ số tổng quan và phân bố theo danh mục. Click vào biểu đồ tròn để lọc theo danh mục.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Tổng số kênh" value={data.kpis.total_channels} />
        <KPICard label="Tổng số video" value={formatNumber(data.kpis.total_videos)} />
        <KPICard label="Tổng lượt xem" value={formatNumber(data.kpis.total_views)} />
        <KPICard
          label="Tỉ lệ short-form"
          value={`${Math.round(data.kpis.short_form_ratio * 100)}%`}
        />
      </div>

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="A1: Phân bố theo danh mục" description="Click để lọc">
          <PieDonut
            data={(data.a1_category_pie ?? []).map((d) => ({
              name: d.channel_category,
              value: d.video_count,
            }))}
            onSliceClick={setSelectedCategory}
            selectedSlice={selectedCategory}
          />
        </ChartCard>

        <ChartCard
          title="A2: Lượt xem theo năm"
          description={selectedCategory ? `Lọc: ${selectedCategory}` : "Tất cả danh mục"}
        >
          <LineChart
            data={data.a2_views_by_year ?? []}
            xKey="year"
            lines={[{ key: "total_views", label: "Lượt xem", color: CHART_PALETTE[3] }]}
            yFormatter={formatNumber}
          />
        </ChartCard>
      </div>

      <div className="mb-8">
        <ChartCard
          title="A3: Tỉ lệ short-form vs long-form theo năm"
          description={selectedCategory ? `Lọc: ${selectedCategory}` : "Tất cả danh mục"}
        >
          <StackedAreaChart
            data={(data.a3_short_long_ratio ?? []).map((d) => ({
              year: d.year,
              short: d.short_ratio,
              long: 1 - d.short_ratio,
            }))}
            xKey="year"
            areas={[
              { key: "short", label: "Short-form", color: CHART_PALETTE[4], stackId: "ratio" },
              { key: "long", label: "Long-form", color: CHART_PALETTE[5], stackId: "ratio" },
            ]}
            pct
          />
        </ChartCard>
      </div>

      {/* Insight */}
      <InsightCard
        content="30,778 video từ 56 kênh trải dài 11 năm. Bùng nổ thật sự bắt đầu từ 2022; short-form vượt mốc 50% từ 2024."
      />
    </div>
  );
}

export default function OverviewPage() {
  return (
    <CategoryFilterProvider>
      <OverviewContent />
    </CategoryFilterProvider>
  );
}
