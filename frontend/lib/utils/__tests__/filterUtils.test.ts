/**
 * Performance test for client-side filtering
 * Verifies <100ms response time for typical datasets
 */

import { applyFilters, FilterableData } from "../filterUtils";
import { FilterState } from "@/app/MultiDimensionalFilterContext";

// Generate mock data
function generateMockData(count: number): FilterableData[] {
  const categories = ["music", "gaming", "education", "entertainment", "tech"];
  const years = [2019, 2020, 2021, 2022, 2023, 2024];
  const data: FilterableData[] = [];

  for (let i = 0; i < count; i++) {
    data.push({
      year: years[i % years.length],
      channel_category: categories[i % categories.length],
      total_views: Math.floor(Math.random() * 10000000),
      video_count: Math.floor(Math.random() * 1000),
    });
  }

  return data;
}

// Test filtering performance
console.log("Testing client-side filtering performance...");

const mockData = generateMockData(1000);

// Test 1: Category filter
const start1 = performance.now();
const filters1: FilterState = {
  category: "music",
  year: null,
  viewRange: null,
  videoRange: null,
};
const filtered1 = applyFilters(mockData, filters1);
const elapsed1 = performance.now() - start1;
console.log(`Category filter: ${elapsed1.toFixed(2)}ms (${filtered1.length} results)`);

// Test 2: Year filter
const start2 = performance.now();
const filters2: FilterState = {
  category: null,
  year: 2023,
  viewRange: null,
  videoRange: null,
};
const filtered2 = applyFilters(mockData, filters2);
const elapsed2 = performance.now() - start2;
console.log(`Year filter: ${elapsed2.toFixed(2)}ms (${filtered2.length} results)`);

// Test 3: Combined filters
const start3 = performance.now();
const filters3: FilterState = {
  category: "gaming",
  year: 2022,
  viewRange: { min: 100000, max: 5000000 },
  videoRange: null,
};
const filtered3 = applyFilters(mockData, filters3);
const elapsed3 = performance.now() - start3;
console.log(`Combined filters: ${elapsed3.toFixed(2)}ms (${filtered3.length} results)`);

const maxTime = Math.max(elapsed1, elapsed2, elapsed3);
console.log(`\nMax time: ${maxTime.toFixed(2)}ms`);
console.log(
  maxTime < 100
    ? "✓ PASS: All filters < 100ms"
    : "✗ FAIL: Some filters >= 100ms"
);
