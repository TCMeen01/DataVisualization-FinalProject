"use client";
/**
 * Economy Page — RO5: Creator economy analysis.
 * Charts: F1 LineChart (commercial video count by month), F2 BarChart (commercial vs non-commercial by category).
 */
import { useEffect, useState } from "react";
import { api, type EconomyData } from "@/lib/api";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { CATEGORIES, formatNumber } from "@/lib/constants";

export default function EconomyPage() {
  const [data, setData] = useState<EconomyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearFrom, setYearFrom] = useState<string>("2024-01");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .economy({
          year_from: yearFrom,
          categories: selectedCategories.length > 0 ? selectedCategories.join(",") : undefined,
        })
        .then(setData)
        .catch((err) => console.error("Failed to load economy data:", err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [yearFrom, selectedCategories]);

  const handleReset = () => {
    setYearFrom("2024-01");
    setSelectedCategories([]);
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
          <label className="text-sm text-[#75758a]">Từ tháng:</label>
          <input
            type="month"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            className="px-2 py-1 text-sm border border-[#d9d9dd] rounded bg-white text-[#212121]"
            min="2015-01"
            max="2026-05"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-[#75758a]">Danh mục:</label>
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className="px-2 py-1 text-xs rounded transition-colors"
                style={{
                  background: selectedCategories.includes(cat) ? "#1863dc" : "#f2f2f2",
                  color: selectedCategories.includes(cat) ? "#ffffff" : "#75758a",
                  border: "1px solid",
                  borderColor: selectedCategories.includes(cat) ? "#1863dc" : "#d9d9dd",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </FilterBar>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#93939f]">RO5</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#212121]">
            Creator Economy
          </h1>
          <p className="mt-3 max-w-2xl text-[#75758a]">
            Phân tích xu hướng video thương mại và YouTube Shopping.
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
                title="F1: Số lượng video thương mại theo tháng"
                description="Vertical reference line: YouTube Shopping VN (10/2024)"
              >
                <LineChart
                  data={data.f1_line}
                  xKey="month"
                  lines={[{ key: "count", label: "Video thương mại", color: "#10b981" }]}
                  referenceLine="2024-10"
                  referenceLabel="YouTube Shopping VN"
                  yFormatter={formatNumber}
                />
              </ChartCard>

              <ChartCard
                title="F2: Avg view commercial vs non-commercial"
                description="Grouped bar chart theo danh mục"
              >
                <BarChart
                  data={data.f2_bar}
                  xKey="category"
                  bars={[
                    { key: "commercial", label: "Commercial", color: "#10b981" },
                    { key: "non_commercial", label: "Non-commercial", color: "#1863dc" },
                  ]}
                  yFormatter={formatNumber}
                />
              </ChartCard>
            </div>

            {/* Top 10 commercial channels table */}
            <div className="mb-8">
              <ChartCard title="Top 10 kênh có nhiều video thương mại nhất" description="">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#d9d9dd]">
                        <th className="text-left py-2 px-3 text-[#93939f] font-medium">#</th>
                        <th className="text-left py-2 px-3 text-[#93939f] font-medium">Kênh</th>
                        <th className="text-right py-2 px-3 text-[#93939f] font-medium">Số video</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_commercial_channels.map((row, i) => (
                        <tr key={i} className="border-b border-[#f2f2f2]">
                          <td className="py-2 px-3 text-[#93939f]">{i + 1}</td>
                          <td className="py-2 px-3 text-[#212121]">{row.channel_name}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-[#212121]">
                            {row.commercial_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>

            <InsightCard
              content="YouTube Shopping ra mắt 10/2024 — số video commercial tăng rõ rệt. Engagement video commercial khác biệt so với nội dung thuần."
            />
          </>
        )}
      </div>
    </div>
  );
}
