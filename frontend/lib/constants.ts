/**
 * frontend/lib/constants.ts
 * Hanoi Air Quality (PM2.5) Dashboard — Design System Constants
 * Tham khảo: REQUIREMENTS.md §5, DESIGN.md §Color Palette
 */

// ──────────────────────────────────────────────────────────────────────────────
// AQI Colors (US EPA standard) — BẮTBUỘC dùng trên toàn dashboard
// ──────────────────────────────────────────────────────────────────────────────
export const AQI_COLORS = {
  Good: "#00e400",                    // 0–12 µg/m³
  Moderate: "#ffff00",                // 12.1–35.4
  Unhealthy_Sensitive: "#ff7e00",     // 35.5–55.4
  Unhealthy: "#ff0000",               // 55.5–150.4
  Very_Unhealthy: "#8f3f97",          // 150.5–250.4
  Hazardous: "#7e0023",               // 250.5–500.4
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Season Colors — dùng cho phân tích theo mùa
// ──────────────────────────────────────────────────────────────────────────────
export const SEASON_COLORS = {
  Spring: "#74c476",                  // Feb–Apr
  Summer: "#fd8d3c",                  // May–Jul
  Autumn: "#d4b483",                  // Aug–Oct
  Winter: "#6baed6",                  // Nov–Jan (mùa tệ nhất)
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Status Colors — cho AI module
// ──────────────────────────────────────────────────────────────────────────────
export const STATUS_COLORS = {
  pending: "#ffa94d",                 // ⏳ Chờ phê duyệt
  approved: "#69db7c",                // ✅ Phê duyệt xong
  executing: "#4c6ee6",               // ⚙️ Đang chạy
  completed: "#00e400",               // ✓ Hoàn tất
  failed: "#ff0000",                  // ✗ Lỗi
  rejected: "#999999",                // 🚫 Từ chối
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Neutral Colors (Dark Theme)
// ──────────────────────────────────────────────────────────────────────────────
export const NEUTRAL_COLORS = {
  primary: "#17171c",                 // Near-black
  canvas: "#ffffff",                  // Page background
  surface: "#f5f5f7",                 // Card/panel background
  text_dark: "#212121",               // Body text
  text_muted: "#75758a",              // Tertiary text
  border_light: "#e5e7eb",            // Divider
  border_hairline: "#d9d9dd",         // Subtle rule
  bg_accent: "#003c33",               // Dark feature band
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Common Constants
// ──────────────────────────────────────────────────────────────────────────────
export const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

export const SEASON_LABELS = ["Spring", "Summer", "Autumn", "Winter"] as const;

export const AQI_CATEGORIES = [
  "Good",
  "Moderate",
  "Unhealthy (Sensitive)",
  "Unhealthy",
  "Very Unhealthy",
  "Hazardous",
] as const;

// ──────────────────────────────────────────────────────────────────────────────
// Number Formatters
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Format PM2.5 value with unit
 * 54.2 → "54.2 µg/m³"
 */
export function formatPM25(value: number): string {
  return `${value.toFixed(1)} µg/m³`;
}

/**
 * Format percentage (0–100)
 * 70.5 → "70.5%"
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get AQI color from PM2.5 value
 */
export function getPM25Color(pm25: number): string {
  if (pm25 < 12) return AQI_COLORS.Good;
  if (pm25 < 35.4) return AQI_COLORS.Moderate;
  if (pm25 < 55.4) return AQI_COLORS.Unhealthy_Sensitive;
  if (pm25 < 150.4) return AQI_COLORS.Unhealthy;
  if (pm25 < 250.4) return AQI_COLORS.Very_Unhealthy;
  return AQI_COLORS.Hazardous;
}

/**
 * Get AQI category from PM2.5 value
 */
export function getPM25Category(pm25: number): string {
  if (pm25 < 12) return "Good";
  if (pm25 < 35.4) return "Moderate";
  if (pm25 < 55.4) return "Unhealthy (Sensitive)";
  if (pm25 < 150.4) return "Unhealthy";
  if (pm25 < 250.4) return "Very Unhealthy";
  return "Hazardous";
}

// ──────────────────────────────────────────────────────────────────────────────
// Chart Palette — dùng cho Recharts/Plotly đa màu (indexed)
// CHART_PALETTE[0]–[7], match với màu season + AQI
// ──────────────────────────────────────────────────────────────────────────────
export const CHART_PALETTE = [
  "#6baed6", // [0] xanh lam (Winter / primary)
  "#fd8d3c", // [1] cam (Summer)
  "#74c476", // [2] xanh lá (Spring / Good)
  "#4c6ee6", // [3] indigo (Line chart mặc định)
  "#ff7e00", // [4] cam đậm (Unhealthy Sensitive)
  "#d4b483", // [5] nâu vàng (Autumn / long-form)
  "#8f3f97", // [6] tím (Very Unhealthy)
  "#69db7c", // [7] xanh mint (short-form)
] as const;


// ──────────────────────────────────────────────────────────────────────────────
// formatNumber — K/M shorthand, dùng cho KPICard và chart tooltips
// formatNumber(1_670_000) → "1.7M"
// formatNumber(30_778)    → "30.8K"
// ──────────────────────────────────────────────────────────────────────────────

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}


// ──────────────────────────────────────────────────────────────────────────────
// labelCategory — map key kỹ thuật → label tiếng Việt hiển thị trên UI
// labelCategory("Good")    → "Tốt"
// labelCategory("Winter")  → "Đông"
// ──────────────────────────────────────────────────────────────────────────────
export function labelCategory(key: string): string {
  const map: Record<string, string> = {
    // AQI categories
    Good: "Tốt",
    Moderate: "Trung bình",
    Unhealthy_Sensitive: "Không tốt (nhạy cảm)",
    "Unhealthy (Sensitive)": "Không tốt (nhạy cảm)",
    Unhealthy: "Không tốt",
    Very_Unhealthy: "Rất xấu",
    "Very Unhealthy": "Rất xấu",
    Hazardous: "Nguy hiểm",
    // Seasons
    Spring: "Xuân",
    Summer: "Hạ",
    Autumn: "Thu",
    Winter: "Đông",
    // Legacy YouTube keys (nếu còn sót)
    Kids: "Thiếu nhi",
    Gaming: "Gaming",
    Music: "Âm nhạc",
    Comedy: "Hài",
    Vlog: "Vlog",
    News: "Tin tức",
    Education: "Giáo dục",
    Sports: "Thể thao",
  };
  return map[key] ?? key; // fallback: trả nguyên key nếu không có trong map
}