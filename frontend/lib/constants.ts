/**
 * frontend/lib/constants.ts
 * Shared constants and formatting helpers — Cohere design system (DESIGN.md).
 */

// ── Chart color palette ──────────────────────────────────────────────────────
// Single concrete theme for all charts.
export const CHART_PALETTE = [
  "#003d5c",
  "#00546e",
  "#006b71",
  "#008162",
  "#009446",
  "#65a31c",
  "#b1aa00",
  "#ffa600",
] as const;

// ── Category palette ────────────────────────────────────────────────────────
// Colours chosen to read on both white canvas (#fff) and deep-green (#003c33)
export const CATEGORY_COLORS: Record<string, string> = {
  Kids:      "#003d5c",
  Gaming:    "#00546e",
  Music:     "#006b71",
  Comedy:    "#008162",
  Vlog:      "#009446",
  News:      "#65a31c",
  Education: "#b1aa00",
  Sports:    "#ffa600",
};

// ── Label arrays ─────────────────────────────────────────────────────────────
export const CATEGORIES = [
  "Kids",
  "Gaming",
  "Music",
  "Comedy",
  "Vlog",
  "News",
  "Education",
  "Sports",
] as const;

export const SUBSCRIBER_TIERS = ["Mega", "Large", "Mid"] as const;

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// ── Number formatters ────────────────────────────────────────────────────────
/**
 * Format a raw number into human-readable notation.
 * formatNumber(1_234_567_890) → "1.2B"
 * formatNumber(456_000)       → "456K"
 * formatNumber(1_234)         → "1.2K"
 * formatNumber(999)           → "999"
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

/**
 * Format a ratio (0–1) as a percentage string.
 * formatPercent(0.1234) → "12.3%"
 */
export function formatPercent(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}
