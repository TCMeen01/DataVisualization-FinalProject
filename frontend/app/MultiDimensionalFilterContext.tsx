"use client";
import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export type FilterDimension = "category" | "year" | "viewRange" | "videoRange";

export interface FilterState {
  category: string | null;
  year: number | null;
  viewRange: { min: number; max: number } | null;
  videoRange: { min: number; max: number } | null;
}

interface MultiDimensionalFilterContextValue {
  filters: FilterState;
  updateFilter: (dimension: FilterDimension, value: string | number | { min: number; max: number } | null) => void;
  clearFilter: (dimension: FilterDimension) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

const MultiDimensionalFilterContext = createContext<MultiDimensionalFilterContextValue>({
  filters: { category: null, year: null, viewRange: null, videoRange: null },
  updateFilter: () => {},
  clearFilter: () => {},
  clearAllFilters: () => {},
  hasActiveFilters: false,
});

/**
 * Parse filters from URL query parameters
 */
function parseFiltersFromURL(searchParams: URLSearchParams): FilterState {
  const filters: FilterState = {
    category: null,
    year: null,
    viewRange: null,
    videoRange: null,
  };

  const category = searchParams.get("category");
  if (category) {
    filters.category = category;
  }

  const year = searchParams.get("year");
  if (year) {
    const yearNum = parseInt(year, 10);
    if (!isNaN(yearNum)) {
      filters.year = yearNum;
    }
  }

  const viewMin = searchParams.get("viewMin");
  const viewMax = searchParams.get("viewMax");
  if (viewMin && viewMax) {
    const min = parseInt(viewMin, 10);
    const max = parseInt(viewMax, 10);
    if (!isNaN(min) && !isNaN(max)) {
      filters.viewRange = { min, max };
    }
  }

  const videoMin = searchParams.get("videoMin");
  const videoMax = searchParams.get("videoMax");
  if (videoMin && videoMax) {
    const min = parseInt(videoMin, 10);
    const max = parseInt(videoMax, 10);
    if (!isNaN(min) && !isNaN(max)) {
      filters.videoRange = { min, max };
    }
  }

  return filters;
}

/**
 * Provider - wrap the Overview page with this
 */
export function MultiDimensionalFilterProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = useMemo(() => parseFiltersFromURL(searchParams), [searchParams]);

    const updateFilter = useCallback(
    (dimension: FilterDimension, value: string | number | { min: number; max: number } | null) => {
      const newFilters = { ...filters };

      if (dimension === "category") {
        newFilters.category = filters.category === value ? null : (value as string | null);
      } else if (dimension === "year") {
        newFilters.year = filters.year === value ? null : (value as number | null);
      } else if (dimension === "viewRange") {
        newFilters.viewRange = value as { min: number; max: number } | null;
      } else if (dimension === "videoRange") {
        newFilters.videoRange = value as { min: number; max: number } | null;
      }

      const params = new URLSearchParams();
      if (newFilters.category) params.set("category", newFilters.category);
      if (newFilters.year !== null) params.set("year", newFilters.year.toString());
      if (newFilters.viewRange) {
        params.set("viewMin", newFilters.viewRange.min.toString());
        params.set("viewMax", newFilters.viewRange.max.toString());
      }
      if (newFilters.videoRange) {
        params.set("videoMin", newFilters.videoRange.min.toString());
        params.set("videoMax", newFilters.videoRange.max.toString());
      }

      const queryString = params.toString();
      router.push(queryString ? `?${queryString}` : window.location.pathname, { scroll: false });
    },
    [filters, router]
  );

    const clearFilter = useCallback(
    (dimension: FilterDimension) => {
      updateFilter(dimension, null);
    },
    [updateFilter]
  );

    const clearAllFilters = useCallback(() => {
    router.push(window.location.pathname, { scroll: false });
  }, [router]);

    const hasActiveFilters = useMemo(() => {
    return (
      filters.category !== null ||
      filters.year !== null ||
      filters.viewRange !== null ||
      filters.videoRange !== null
    );
  }, [filters]);

  const value = useMemo(
    () => ({
      filters,
      updateFilter,
      clearFilter,
      clearAllFilters,
      hasActiveFilters,
    }),
    [filters, updateFilter, clearFilter, clearAllFilters, hasActiveFilters]
  );

  return (
    <MultiDimensionalFilterContext.Provider value={value}>
      {children}
    </MultiDimensionalFilterContext.Provider>
  );
}

/**
 * Hook - consume multi-dimensional filter state in any component
 */
export function useMultiDimensionalFilter() {
  return useContext(MultiDimensionalFilterContext);
}
