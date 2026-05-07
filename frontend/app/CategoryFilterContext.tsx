"use client";
/**
 * CategoryFilterContext — React Context for Overview cross-filter.
 * Scoped to the Overview page only. No global state needed.
 *
 * Usage:
 *   <CategoryFilterProvider>
 *     <PieDonut onSliceClick={setSelectedCategory} selectedSlice={selectedCategory} />
 *     <LineChart ... />  // consumes selectedCategory
 *   </CategoryFilterProvider>
 */
import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface CategoryFilterContextValue {
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
}

const CategoryFilterContext = createContext<CategoryFilterContextValue>({
  selectedCategory: null,
  setSelectedCategory: () => {},
});

/** Provider — wrap the Overview page with this */
export function CategoryFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedCategory, setSelectedCategoryRaw] = useState<string | null>(null);

  // Toggle: passing the currently-selected category resets to null
  const setSelectedCategory = useCallback((cat: string | null) => {
    setSelectedCategoryRaw((prev) => (prev === cat ? null : cat));
  }, []);

  const value = useMemo(
    () => ({ selectedCategory, setSelectedCategory }),
    [selectedCategory, setSelectedCategory],
  );

  return (
    <CategoryFilterContext.Provider value={value}>
      {children}
    </CategoryFilterContext.Provider>
  );
}

/** Hook — consume cross-filter state in any chart component */
export function useCategoryFilter() {
  return useContext(CategoryFilterContext);
}
