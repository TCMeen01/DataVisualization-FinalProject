/**
 * FilterBadges - Display active filters with clear buttons
 * Shows badges for each active filter dimension
 */

import { X } from "lucide-react";
import { FilterState, FilterDimension } from "@/app/MultiDimensionalFilterContext";
import { Button } from "@/components/ui/button";

interface FilterBadgesProps {
  filters: FilterState;
  onClearFilter: (dimension: FilterDimension) => void;
  onClearAll: () => void;
}

export function FilterBadges({ filters, onClearFilter, onClearAll }: FilterBadgesProps) {
  const badges: { dimension: FilterDimension; label: string; value: string }[] = [];

  if (filters.category) {
    badges.push({
      dimension: "category",
      label: "Danh mục",
      value: filters.category,
    });
  }

  if (filters.year !== null) {
    badges.push({
      dimension: "year",
      label: "Năm",
      value: filters.year.toString(),
    });
  }

  if (filters.viewRange) {
    badges.push({
      dimension: "viewRange",
      label: "Lượt xem",
      value: `${filters.viewRange.min.toLocaleString()} - ${filters.viewRange.max.toLocaleString()}`,
    });
  }

  if (filters.videoRange) {
    badges.push({
      dimension: "videoRange",
      label: "Số video",
      value: `${filters.videoRange.min} - ${filters.videoRange.max}`,
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-300">
      <span className="text-sm font-medium text-zinc-600">Bộ lọc:</span>

      {badges.map((badge) => (
        <div
          key={badge.dimension}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800 transition-all hover:bg-blue-200 animate-in fade-in slide-in-from-left-2 duration-300"
        >
          <span className="text-xs text-blue-600">{badge.label}:</span>
          <span>{badge.value}</span>
          <button
            onClick={() => onClearFilter(badge.dimension)}
            className="ml-1 rounded-full p-0.5 hover:bg-blue-300 transition-colors"
            aria-label={`Xóa bộ lọc ${badge.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {badges.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-8 text-xs text-zinc-600 hover:text-zinc-900 animate-in fade-in slide-in-from-right-2 duration-300"
        >
          Xóa tất cả bộ lọc
        </Button>
      )}
    </div>
  );
}
