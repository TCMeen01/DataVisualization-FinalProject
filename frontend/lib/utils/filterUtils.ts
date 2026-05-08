/**
 * Client-side filtering utilities for Overview dashboard
 * Filters data in-memory for instant response (<100ms)
 */

import { FilterState } from "@/app/MultiDimensionalFilterContext";

export interface FilterableData {
  year?: number;
  channel_category?: string;
  total_views?: number;
  video_count?: number;
  [key: string]: unknown;
}

/**
 * Apply multi-dimensional filters to data array
 * Combines filters with AND logic
 */
export function applyFilters<T extends FilterableData>(
  data: T[],
  filters: FilterState
): T[] {
  let result = data;

  // Filter by category
  if (filters.category) {
    result = result.filter(
      (item) =>
        item.channel_category?.toLowerCase() === filters.category?.toLowerCase()
    );
  }

  // Filter by year
  if (filters.year !== null) {
    result = result.filter((item) => item.year === filters.year);
  }

  // Filter by view range
  if (filters.viewRange) {
    result = result.filter((item) => {
      if (typeof item.total_views !== "number") return true;
      return (
        item.total_views >= filters.viewRange!.min &&
        item.total_views <= filters.viewRange!.max
      );
    });
  }

  // Filter by video range
  if (filters.videoRange) {
    result = result.filter((item) => {
      if (typeof item.video_count !== "number") return true;
      return (
        item.video_count >= filters.videoRange!.min &&
        item.video_count <= filters.videoRange!.max
      );
    });
  }

  return result;
}
