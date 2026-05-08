"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useCallback } from "react";

export interface FilterState {
  dateRange?: { start: string; end: string };
  category?: string;
  search?: string;
}

export interface FilterOptions {
  categories?: string[];
  enableDateRange?: boolean;
  enableSearch?: boolean;
}

export interface ChartItem {
  id: string | number;
  title: string;
  created_at?: string;
  category?: string;
  [key: string]: unknown;
}

/**
 * Hook for client-side chart filtering with URL sync
 * Filters charts in-memory without page reload, syncs state with URL query params
 */
export function useChartFilter<T extends ChartItem>(
  charts: T[],
  options: FilterOptions = {}
) {
  void options;
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parse filters from URL query params
  const filters = useMemo<FilterState>(() => {
    return parseFiltersFromQuery(searchParams);
  }, [searchParams]);

  // Apply filters to chart array using useMemo for performance
  const filteredCharts = useMemo<T[]>(() => {
    return applyFilters(charts, filters);
  }, [charts, filters]);

  // Update URL with new filters without page reload
  const updateFilters = useCallback(
    (newFilters: Partial<FilterState>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update date range
      if (newFilters.dateRange !== undefined) {
        if (newFilters.dateRange) {
          params.set("dateStart", newFilters.dateRange.start);
          params.set("dateEnd", newFilters.dateRange.end);
        } else {
          params.delete("dateStart");
          params.delete("dateEnd");
        }
      }

      // Update category
      if (newFilters.category !== undefined) {
        if (newFilters.category) {
          params.set("category", newFilters.category);
        } else {
          params.delete("category");
        }
      }

      // Update search
      if (newFilters.search !== undefined) {
        if (newFilters.search) {
          params.set("search", newFilters.search);
        } else {
          params.delete("search");
        }
      }

      // Push to URL without reload
      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : window.location.pathname, {
        scroll: false,
      });
    },
    [searchParams, router]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(window.location.pathname, { scroll: false });
  }, [router]);

  return {
    filters,
    filteredCharts,
    updateFilters,
    clearFilters,
    hasActiveFilters: Object.keys(filters).length > 0,
  };
}

/**
 * Extract filters from URL query parameters
 */
function parseFiltersFromQuery(searchParams: URLSearchParams): FilterState {
  const filters: FilterState = {};

  const dateStart = searchParams.get("dateStart");
  const dateEnd = searchParams.get("dateEnd");
  if (dateStart && dateEnd) {
    filters.dateRange = { start: dateStart, end: dateEnd };
  }

  const category = searchParams.get("category");
  if (category) {
    filters.category = category;
  }

  const search = searchParams.get("search");
  if (search) {
    filters.search = search;
  }

  return filters;
}

/**
 * Filter chart array in-memory based on filter state
 */
function applyFilters<T extends ChartItem>(
  charts: T[],
  filters: FilterState
): T[] {
  let result = charts;

  // Filter by date range
  if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
    const start = new Date(filters.dateRange.start);
    const end = new Date(filters.dateRange.end);
    result = result.filter((chart) => {
      if (!chart.created_at) return true;
      const chartDate = new Date(chart.created_at);
      return chartDate >= start && chartDate <= end;
    });
  }

  // Filter by category
  if (filters.category) {
    result = result.filter(
      (chart) =>
        chart.category?.toLowerCase() === filters.category?.toLowerCase()
    );
  }

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter((chart) =>
      chart.title.toLowerCase().includes(searchLower)
    );
  }

  return result;
}
