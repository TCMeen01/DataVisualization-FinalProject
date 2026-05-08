/**
 * frontend/lib/design-tokens.ts
 * Cohere design system tokens from DESIGN.md
 */

// ── Color tokens ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Primary & backgrounds
  primary: "#17171c",           // CTA chính, footer, dark UI cards
  cohereBlack: "#000000",       // Announcement bar, anchor đậm nhất
  deepGreen: "#003c33",         // Dark feature band cho dashboard
  darkNavy: "#071829",          // Solution band thay thế
  ink: "#212121",               // Body text trên nền sáng
  canvas: "#ffffff",            // Page background
  softStone: "#eeece7",         // Product/testimonial cards
  paleGreen: "#edfce9",         // Section backdrop tươi
  paleBlue: "#f1f5ff",          // CTA backdrop tươi

  // Borders & dividers
  cardBorder: "#f2f2f2",        // Card outline mềm nhất
  hairline: "#d9d9dd",          // List rule, divider
  borderLight: "#e5e7eb",       // Secondary divider

  // Text colors
  muted: "#93939f",             // Footer, metadata
  slate: "#75758a",             // Tertiary text
  bodyMuted: "#616161",         // Body de-emphasized

  // Action & interactive
  actionBlue: "#1863dc",        // Editorial link, pagination
  focusBlue: "#4c6ee6",         // Focus ring
  coral: "#ff7759",             // Taxonomy chip (logs filter)
  coralSoft: "#ffad9b",         // Soft chip border
  formFocus: "#9b60aa",         // Input focus border
  error: "#b30000",             // Validation error
} as const;

// ── Tailwind class helpers ──────────────────────────────────────────────────
// Map design tokens to Tailwind utility classes for consistency
export const TEXT_COLORS = {
  ink: "text-[#212121]",
  muted: "text-[#93939f]",
  slate: "text-[#75758a]",
  bodyMuted: "text-[#616161]",
  actionBlue: "text-[#1863dc]",
  white: "text-white",
} as const;

export const BG_COLORS = {
  canvas: "bg-[#ffffff]",
  primary: "bg-[#17171c]",
  deepGreen: "bg-[#003c33]",
  softStone: "bg-[#eeece7]",
  paleGreen: "bg-[#edfce9]",
  paleBlue: "bg-[#f1f5ff]",
  cardBorder: "bg-[#f2f2f2]",
} as const;

export const BORDER_COLORS = {
  cardBorder: "border-[#f2f2f2]",
  hairline: "border-[#d9d9dd]",
  borderLight: "border-[#e5e7eb]",
  actionBlue: "border-[#1863dc]",
} as const;
