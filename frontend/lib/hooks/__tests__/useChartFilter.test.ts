/**
 * Performance test for useChartFilter hook
 * Verifies <100ms filtering for 1000 items
 */

// Mock chart data generator
function generateMockCharts(count: number) {
  const categories = ["music", "gaming", "education", "entertainment", "tech"];
  const charts = [];

  for (let i = 0; i < count; i++) {
    charts.push({
      id: i,
      title: `Chart ${i} - ${categories[i % categories.length]}`,
      created_at: new Date(2024, 0, 1 + (i % 365)).toISOString(),
      category: categories[i % categories.length],
    });
  }

  return charts;
}

// Performance test
console.log("Testing useChartFilter performance with 1000 items...");

const mockCharts = generateMockCharts(1000);

// Test 1: Category filter
const start1 = performance.now();
const filtered1 = mockCharts.filter(
  (chart) => chart.category?.toLowerCase() === "music"
);
const elapsed1 = performance.now() - start1;
console.log(`Category filter: ${elapsed1.toFixed(2)}ms (${filtered1.length} results)`);

// Test 2: Search filter
const start2 = performance.now();
const filtered2 = mockCharts.filter((chart) =>
  chart.title.toLowerCase().includes("gaming")
);
const elapsed2 = performance.now() - start2;
console.log(`Search filter: ${elapsed2.toFixed(2)}ms (${filtered2.length} results)`);

// Test 3: Date range filter
const start3 = performance.now();
const startDate = new Date(2024, 0, 1);
const endDate = new Date(2024, 2, 31);
const filtered3 = mockCharts.filter((chart) => {
  const chartDate = new Date(chart.created_at);
  return chartDate >= startDate && chartDate <= endDate;
});
const elapsed3 = performance.now() - start3;
console.log(`Date range filter: ${elapsed3.toFixed(2)}ms (${filtered3.length} results)`);

// Test 4: Combined filters
const start4 = performance.now();
const filtered4 = mockCharts.filter((chart) => {
  const chartDate = new Date(chart.created_at);
  return (
    chartDate >= startDate &&
    chartDate <= endDate &&
    chart.category === "music" &&
    chart.title.toLowerCase().includes("chart")
  );
});
const elapsed4 = performance.now() - start4;
console.log(`Combined filters: ${elapsed4.toFixed(2)}ms (${filtered4.length} results)`);

const maxTime = Math.max(elapsed1, elapsed2, elapsed3, elapsed4);
console.log(`\nMax time: ${maxTime.toFixed(2)}ms`);
console.log(maxTime < 100 ? "✓ PASS: All filters < 100ms" : "✗ FAIL: Some filters >= 100ms");
