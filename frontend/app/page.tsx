"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { api, type OverviewData } from "@/lib/api";
import { MultiDimensionalFilterProvider, useMultiDimensionalFilter } from "./MultiDimensionalFilterContext";
import { KPICard } from "@/components/dashboard/KPICard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { FilterBadges } from "@/components/dashboard/FilterBadges";
import { ChartCard } from "@/components/charts/ChartCard";
import { PieDonut } from "@/components/charts/PieDonut";
import { LineChart } from "@/components/charts/LineChart";
import { StackedAreaChart } from "@/components/charts/StackedAreaChart";
import { CHART_PALETTE, formatNumber, labelCategory } from "@/lib/constants";
import { TEXT_COLORS } from "@/lib/design-tokens";
import { applyFilters } from "@/lib/utils/filterUtils";
import { calculateKPIs } from "@/lib/utils/kpiUtils";

function OverviewContent() {
  const { filters, updateFilter, clearFilter, clearAllFilters, hasActiveFilters } = useMultiDimensionalFilter();
  const [rawData, setRawData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  useEffect(() => {
    api
      .overview()
      .then(setRawData)
      .catch((err) => console.error("Failed to load overview:", err))
      .finally(() => setLoading(false));
  }, []);

  const categoryPieData = useMemo(() => {
    if (!rawData?.a1_category_pie) return [];

    const categoryScopedFilters = { ...filters, category: null };

    return applyFilters(rawData.a1_category_pie, categoryScopedFilters)
      .map((d) => ({
        name: labelCategory(d.channel_category),
        category: d.channel_category,
        value: d.video_count,
      }))
      .filter((d) => d.value > 0);
  }, [rawData, filters]);

  const filteredA2Data = useMemo(() => {
    if (!rawData?.a2_views_by_year) return [];
    return applyFilters(rawData.a2_views_by_year, filters);
  }, [rawData, filters]);

  const filteredA3Data = useMemo(() => {
    if (!rawData?.a3_short_long_ratio) return [];
    return applyFilters(rawData.a3_short_long_ratio, filters);
  }, [rawData, filters]);

  const kpis = useMemo(() => {
    if (!rawData) return null;

    if (!hasActiveFilters) {
      return rawData.kpis;
    }

    const filtered = applyFilters(rawData.a1_category_pie || [], filters);

    return filtered.length > 0 ? calculateKPIs(filtered) : rawData.kpis;
  }, [rawData, filters, hasActiveFilters]);

  const handleGetInsight = async () => {
    if (!rawData || !kpis) return;

    setInsightLoading(true);
    setInsightError("");

    try {
      const response = await api.generateInsight({
        page: "overview",
        filters: {
          category: filters.category,
          year: filters.year,
        },
        summary: {
          total_videos: kpis.total_videos,
          total_channels: kpis.total_channels,
          total_views: kpis.total_views,
          short_form_ratio: kpis.short_form_ratio,
          category: filters.category,
          year: filters.year,
        },
      });

      setInsight(response.insight);
    } catch (error) {
      setInsightError(error instanceof Error ? error.message : "Không thể tạo insight. Vui lòng thử lại.");
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-10 py-12">
        <p className={TEXT_COLORS.muted}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!rawData || !kpis) {
    return (
      <div className="px-10 py-12">
        <p className={TEXT_COLORS.muted}>Không thể tải dữ liệu. Kiểm tra backend.</p>
      </div>
    );
  }

  return (
    <div className="px-10 py-12">
      <header className="mb-8">
        <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>Bảng điều khiển</p>
        <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>
          Tổng Quan
        </h1>
        <p className={`mt-3 max-w-3xl ${TEXT_COLORS.slate} italic font-semibold`}>
          Dữ liệu được thu thập vào ngày 05/05/2026.
        </p>
        <p className={`mt-3 max-w-3xl ${TEXT_COLORS.slate}`}>
          Chỉ số tổng quan và phân bố theo danh mục. Click vào biểu đồ để lọc theo danh mục và năm.
        </p>
      </header>

      {hasActiveFilters && (
        <div className="mb-6">
          <FilterBadges
            filters={filters}
            onClearFilter={clearFilter}
            onClearAll={clearAllFilters}
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-300">
        <KPICard label="Tổng số kênh" value={kpis.total_channels} loading={loading} />
        <KPICard label="Tổng số video" value={formatNumber(kpis.total_videos)} loading={loading} />
        <KPICard label="Tổng lượt xem" value={formatNumber(kpis.total_views)} loading={loading} />
        <KPICard
          label="Tỉ lệ short-form"
          value={`${Math.round(kpis.short_form_ratio * 100)}%`}
          loading={loading}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 transition-all duration-500">
        <ChartCard title="A1: Phân bố theo danh mục" description="Click để lọc">
          <PieDonut
            data={categoryPieData}
            onSliceClick={(category) => updateFilter("category", category || null)}
            selectedSlice={filters.category}
          />
        </ChartCard>

        <ChartCard
          title="A2: Lượt xem theo năm"
          description={filters.category ? `Lọc: ${labelCategory(filters.category)}` : "Tất cả danh mục"}
        >
          <LineChart
            data={filteredA2Data}
            xKey="year"
            lines={[{ key: "total_views", label: "Lượt xem", color: CHART_PALETTE[3] }]}
            yFormatter={formatNumber}
            selectedYear={filters.year}
            onYearClick={(year) => updateFilter("year", year)}
          />
        </ChartCard>
      </div>

      <div className="mb-8 transition-all duration-500">
        <ChartCard
          title="A3: Tỉ lệ video ngắn và video dài theo năm"
          description={filters.category ? `Lọc: ${labelCategory(filters.category)}` : "Tất cả danh mục"}
        >
          <StackedAreaChart
            data={(filteredA3Data ?? []).map((d) => ({
              year: d.year,
              short: d.short_ratio,
              long: 1 - d.short_ratio,
            }))}
            xKey="year"
            areas={[
              { key: "short", label: "Video ngắn", color: CHART_PALETTE[7], stackId: "ratio" },
              { key: "long", label: "Video dài", color: CHART_PALETTE[5], stackId: "ratio" },
            ]}
            pct
            selectedYear={filters.year}
            onYearClick={(year) => updateFilter("year", year)}
          />
        </ChartCard>
      </div>

      <InsightCard
        content={insight}
        loading={insightLoading}
        error={insightError}
        onGetInsight={handleGetInsight}
      />
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<div className="px-10 py-12"><p className={TEXT_COLORS.muted}>Đang tải bộ lọc...</p></div>}>
      <MultiDimensionalFilterProvider>
        <OverviewContent />
      </MultiDimensionalFilterProvider>
    </Suspense>
  );
}
