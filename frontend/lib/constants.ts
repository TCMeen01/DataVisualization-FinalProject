/**
 * frontend/lib/constants.ts
 * Shared constants and formatting helpers — Cohere design system (DESIGN.md).
 */

// ── Category palette ────────────────────────────────────────────────────────
// Colours chosen to read on both white canvas (#fff) and deep-green (#003c33)
export const CATEGORY_COLORS: Record<string, string> = {
  Kids:      "#f59e0b", // amber
  Gaming:    "#10b981", // emerald
  Music:     "#8b5cf6", // violet
  Comedy:    "#ff7759", // coral (Cohere brand accent)
  Vlog:      "#38bdf8", // sky
  News:      "#f43f5e", // rose
  Education: "#84cc16", // lime
  Sports:    "#fb923c", // orange
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
