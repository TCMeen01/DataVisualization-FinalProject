/**
 * frontend/lib/constants.ts
 * Shared constants and formatting helpers — Cohere design system (DESIGN.md).
 */

// ── Chart color palette ──────────────────────────────────────────────────────
// Cohere design system palette (DESIGN.md) — deep-green to warm accent progression
export const CHART_PALETTE = [
  "#003c33", // deep-green (primary)
  "#1863dc", // action-blue
  "#4c6ee6", // focus-blue
  "#9b60aa", // form-focus (purple)
  "#ff7759", // coral
  "#ffad9b", // coral-soft
  "#65a31c", // olive-green
  "#ffa600", // warm-orange
] as const;

// ── Category palette ────────────────────────────────────────────────────────
// Colours chosen to read on both white canvas (#fff) and deep-green (#003c33)
export const CATEGORY_COLORS: Record<string, string> = {
  Kids:      "#003c33", // deep-green
  Gaming:    "#1863dc", // action-blue
  Music:     "#4c6ee6", // focus-blue
  Comedy:    "#9b60aa", // form-focus
  Vlog:      "#ff7759", // coral
  News:      "#ffad9b", // coral-soft
  Education: "#65a31c", // olive-green
  Sports:    "#ffa600", // warm-orange
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

export const CATEGORY_LABELS: Record<string, string> = {
  Kids: "Thiếu nhi",
  Gaming: "Trò chơi",
  Music: "Âm nhạc",
  Comedy: "Hài",
  Vlog: "Nhật ký đời sống",
  News: "Tin tức",
  Education: "Giáo dục",
  Sports: "Thể thao",
};

export const SUBSCRIBER_TIERS = ["Mega", "Large", "Mid"] as const;

export const SUBSCRIBER_TIER_LABELS: Record<string, string> = {
  Micro: "Siêu nhỏ",
  Mid: "Trung bình",
  Large: "Lớn",
  Mega: "Siêu lớn",
};

export const DURATION_LABELS: Record<string, string> = {
  Short: "Ngắn",
  Medium: "Trung bình",
  Long: "Dài",
};

export const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"] as const;

export function labelCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function labelSubscriberTier(tier: string): string {
  return SUBSCRIBER_TIER_LABELS[tier] ?? tier;
}

export function labelDuration(duration: string): string {
  return DURATION_LABELS[duration] ?? duration;
}

// ── Number formatters ────────────────────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}Tỷ`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}Tr`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}N`;
  return String(Math.round(n));
}

/**
 * Format a ratio (0–1) as a percentage string.
 * formatPercent(0.1234) → "12.3%"
 */
export function formatPercent(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}
