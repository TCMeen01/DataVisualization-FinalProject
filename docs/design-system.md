# Design System — vn-dataviz-ai

Tham chiếu chính: [`DESIGN.md`](../DESIGN.md) (Cohere 2026 web system) — extract bằng `getdesign.md`.
INIT.md §8 còn nhắc Sentry (dark, data-dense) và Supabase (dark emerald, code-first), nhưng nguồn duy nhất đã fetch là Cohere. Tokens dưới đây lấy từ Cohere, ghi chú nơi sẽ pha thêm Sentry/Supabase ở các milestone sau.

## Color tokens (Tailwind)

| Token | Hex | Mục đích |
|---|---|---|
| `primary` (gần đen) | `#17171c` | CTA chính, footer, dark UI cards |
| `cohere-black` | `#000000` | Announcement bar, anchor đậm nhất |
| `deep-green` | `#003c33` | Dark feature band cho dashboard (chọn thay cho violet) |
| `dark-navy` | `#071829` | Solution band thay thế (security/finance theme) |
| `ink` | `#212121` | Body text trên nền sáng |
| `canvas` | `#ffffff` | Page background |
| `soft-stone` | `#eeece7` | Product/testimonial cards |
| `pale-green` | `#edfce9` | Section backdrop tươi |
| `pale-blue` | `#f1f5ff` | CTA backdrop tươi |
| `card-border` | `#f2f2f2` | Card outline mềm nhất |
| `hairline` | `#d9d9dd` | List rule, divider |
| `border-light` | `#e5e7eb` | Secondary divider |
| `muted` | `#93939f` | Footer, metadata |
| `slate` | `#75758a` | Tertiary text |
| `body-muted` | `#616161` | Body de-emphasized |
| `action-blue` | `#1863dc` | Editorial link, pagination |
| `focus-blue` | `#4c6ee6` | Focus ring |
| `coral` | `#ff7759` | Taxonomy chip (logs filter) |
| `coral-soft` | `#ffad9b` | Soft chip border |
| `form-focus` | `#9b60aa` | Input focus border |
| `error` | `#b30000` | Validation error |

**Quyết định:** đi với palette **Cohere deep-green + canvas** thay vì emerald/violet ban đầu. Lý do: nguồn DESIGN.md đã chuẩn hoá full Cohere; dùng nguyên hệ giữ tính nhất quán. Khi pha Supabase emerald (milestone 2), giữ deep-green làm primary và dùng emerald-400/500 cho status badge "executed/completed" trong code block panel.

## Typography

- **Display:** `CohereText`, fallback `Space Grotesk`, `Inter`, `ui-sans-serif`.
- **Body/UI:** `Unica77 Cohere Web`, fallback `Inter`, `Arial`, `ui-sans-serif`.
- **Mono:** `CohereMono`, fallback `Geist Mono`, `ui-monospace`.

Hiện dự án đang dùng `Geist` + `Geist Mono` (default từ Next.js). Khi cần aligning với Cohere, swap qua `Inter` + `JetBrains Mono` (hoặc giữ Geist như font fallback hợp lệ).

| Role | Size | Weight | Line height | Tracking |
|---|---:|---:|---:|---:|
| Hero Display | 96px | 400 | 1.00 | -1.92px |
| Product Display | 72px | 400 | 1.00 | -1.44px |
| Section Heading | 48px | 400 | 1.20 | -0.48px |
| Card Heading | 32px | 400 | 1.20 | -0.32px |
| Feature Heading | 24px | 400 | 1.30 | 0 |
| Body Large | 18px | 400 | 1.40 | 0 |
| Body | 16px | 400 | 1.50 | 0 |
| Button | 14px | 500 | 1.71 | 0 |
| Mono Label | 14px | 400 | 1.40 | 0.28px (uppercase) |
| Micro | 12px | 400 | 1.40 | 0 |

## Radius

| Token | Value | Use |
|---|---:|---|
| `xs` | 4px | Search field, thumbnail |
| `sm` | 8px | Card, dialog, blog chip |
| `md` | 16px | Medium product card |
| `lg` | 22px | Hero media card |
| `xl` | 30px | Filter pill |
| `pill` | 32px | Primary CTA |
| `full` | 9999px | Status dot |

## Spacing scale

`xxs=2 · xs=6 · sm=8 · md=12 · lg=16 · xl=24 · xxl=32 · section=80` (px)

## Component mapping (3 trang dự án)

### Dashboard `/`
- Hero card style **Cohere** — large h1 + canvas background + 22px radius cho schema card.
- Schema columns hiển thị dạng `capability-card` mini: `border-card-border`, `rounded-sm`, padding 16-24px.
- Khi có chart thật: dùng `dark-feature-band` deep-green cho hero metric, `product-card` (soft-stone) cho secondary stats.

### AI Workspace `/ai`
- 2-column layout: input panel (canvas) + code panel (`agent-console-card`: bg `#17171c`, text white).
- Status badge dùng theme **Supabase** (emerald) cho `executed/completed`, coral cho `rejected`.
- Code block: dark panel với mono font, border `hairline` mờ.

### Logs `/logs`
- Layout panel **Sentry-inspired**: dense rows, hairline dividers, monospace timestamp.
- Filter pills dùng `blog-filter-chip` (coral khi active) → cho status filter.
- Mỗi row: prompt left + status badge right + `caption` cho metadata.

## Do's & Don'ts (rút từ DESIGN.md)

**Do:**
- Canvas trắng làm nền mặc định; deep-green/dark-navy chỉ dùng full-width band.
- CTA chính là pill 32px, near-black.
- Mono label uppercase 14px cho category/system markers.

**Don't:**
- Đừng dùng coral/blue làm nền lớn.
- Đừng add drop shadow nặng — Cohere flat.
- Đừng dùng radius < 8px cho media chính.
- Đừng dùng gradient saturated làm UI background.

## Roadmap pha thêm Sentry & Supabase

1. **Logs page** — apply Sentry layout: dense table, hairline rules, fixed-width status column.
2. **Code block component** — apply Supabase: emerald accent + status chips, code-first dark panel.
3. **Hero dashboard** — apply Cohere `dark-feature-band` cho KPI hero gradient.
