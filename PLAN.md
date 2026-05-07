# Kế hoạch triển khai — Vietnam YouTube Analytics Dashboard + AI Module

## Context

Đồ án cuối kỳ "Trực quan hóa dữ liệu" cần một **Dashboard YouTube VN** + **AI Module** Human-in-the-loop. Mỗi trang dashboard map 1-1 với một **Research Objective (RO)** trong [Bao_cao_de_tai.md](Bao_cao_de_tai.md) — storytelling là tiêu chí trọng tâm cho buổi vấn đáp.

**Cấu trúc 8 routes** (theo REQUIREMENTS.md §3.1):

| Route | Tên | RO | Charts MVP |
|---|---|---|---|
| `/` | Tổng Quan | — | 3 + 4 KPI |
| `/short-form` | Xu Hướng Short-form | RO1 | 2 |
| `/channels` | Tăng Trưởng Kênh | RO2 | 2 |
| `/anomaly` | Bất Thường & Viral | RO3 | 2 |
| `/interaction` | Nghịch Lý Tương Tác | RO4 | 2 |
| `/economy` | Creator Economy | RO5 | 2 |
| `/ai` | AI Workspace | — | — |
| `/logs` | Audit Logs | — | — |

Trạng thái scaffold:
- **Backend:** `/api/execute` chỉ là mock; `GeminiClient` không gọi LLM thật; executor không copy CSV vào sandbox và không base64 encode figures; `/api/data` còn refer `sample.csv`.
- **Frontend:** mới có 3 trang skeleton (`/`, `/ai`, `/logs`); thiếu hoàn toàn charts, Monaco integration, 4 page RO mới (`/short-form`, `/anomaly`, `/interaction`, `/economy`), cross-filter.
- **Data:** ✅ `videos_processed.csv` (20.8MB) + `channels_processed.csv` (16KB) đã có trong [backend/data/](backend/data/).

**Quyết định scope theo user:** **13 charts MVP** (Overview 3 + 5 RO × 2). Vượt nhẹ con số "10" duyệt ban đầu nhưng phân bố đều 1 RO/page → demo vấn đáp mạnh hơn. Cross-filter chỉ trên Overview (Pie A1 click → filter A2, A3).

**Mục tiêu:** đạt toàn bộ Definition of Done trong [REQUIREMENTS.md](REQUIREMENTS.md) §11, 8 tiêu chí đánh giá §7, và trả lời 6 câu hỏi vấn đáp §8 (5 câu map 1-1 với 5 RO + 1 câu meta).

---

## Phase 1 — Backend wiring (foundation cho mọi data thật)

### 1.1 Cache data layer (NEW)
**File:** [backend/app/services/data_store.py](backend/app/services/data_store.py)
- Singleton in-memory: load `videos_processed.csv` + `channels_processed.csv` ở [main.py:lifespan](backend/app/main.py) sau `init_db()`.
- Expose 6 method aggregation map 1-1 với 6 page dashboard:
  - `get_videos() -> pd.DataFrame`, `get_channels() -> pd.DataFrame`
  - `get_full_schema()` → format chuẩn theo [REQUIREMENTS.md §4.5](REQUIREMENTS.md): `{videos: {row_count, columns: [{name, dtype, null_count, min, max, mean}]}, channels: {...}}`
  - `get_overview(category: str | None)` → 4 KPI + 3 chart dataset (A1 pie, A2 line year, A3 area short/long); optional cross-filter theo category
  - `get_short_form(year_from, category)` → 2 chart dataset (B1 heatmap channel×year, B2 stacked bar) — RO1
  - `get_channels_data(category, tier)` → 2 chart dataset (C1 box, C2 scatter sub vs avg) — RO2
  - `get_anomaly(channel_id, year_from, year_to)` → 2 chart dataset (D1 scatter view×lvr suspect, D2 top viral table) — RO3
  - `get_interaction(categories, duration_group)` → 2 chart dataset (E1 box engage×duration×tier, E2 heatmap dow×hour) — RO4
  - `get_economy(year_from, categories)` → 2 chart dataset (F1 line commercial monthly, F2 bar commercial vs not) + top 10 commercial channels — RO5
- **Lý do:** đọc CSV mỗi request quá chậm với 30k rows; cache pandas DataFrame là tiêu chuẩn.

### 1.2 Rewrite [backend/app/api/data.py](backend/app/api/data.py)
- Bỏ `sample.csv` reference.
- 6 endpoint aggregation map 1-1 với 6 page + 2 endpoint utility:
  - `GET /api/data/schema` → `data_store.get_full_schema()` (cho AI prompt injection)
  - `GET /api/data/overview?category=` → KPI + Chart A1, A2, A3
  - `GET /api/data/short-form?year_from=&category=` → Chart B1, B2 (RO1)
  - `GET /api/data/channels?category=&tier=` → Chart C1, C2 (RO2)
  - `GET /api/data/anomaly?channel_id=&year_from=&year_to=` → Chart D1, D2 (RO3)
  - `GET /api/data/interaction?categories=&duration_group=` → Chart E1, E2 (RO4)
  - `GET /api/data/economy?year_from=&categories=` → Chart F1, F2 (RO5; default year_from=2024-01)
  - `GET /api/data/preview?source=videos|channels&limit=20` → giữ cho debug

### 1.3 Real Gemini integration
**File:** [backend/app/services/llm/gemini.py](backend/app/services/llm/gemini.py) — REPLACE stub
- `import google.generativeai as genai`
- `genai.configure(api_key=settings.GEMINI_API_KEY)` lazy init
- `model = genai.GenerativeModel("gemini-2.0-flash")`
- Format prompt: `build_system_prompt(video_schema, channel_schema)` + history messages + user prompt
- Call `await model.generate_content_async(...)`; parse JSON từ `response.text` (regex bóc JSON khỏi markdown code fence nếu có).
- Fallback: nếu parse fail → trả `{code: "", explanation: "Lỗi parse response từ Gemini: ..."}` (UI sẽ hiển thị lỗi thay vì crash).

### 1.4 System prompt đầy đủ theo §4.3
**File:** [backend/app/services/llm/prompts.py](backend/app/services/llm/prompts.py)
- Hàm `build_system_prompt(video_schema_text: str, channel_schema_text: str) -> str` — render template với 9 quy tắc, inject schema dạng list cột + dtype + range/nulls (lấy từ `data_store.get_full_schema()`).
- Yêu cầu LLM trả JSON `{"code": "...", "explanation": "..."}` thuần (không markdown).

### 1.5 Executor mở rộng
**File:** [backend/app/services/executor.py](backend/app/services/executor.py)
- Trước `subprocess.run`: copy (hoặc symlink trên Windows fallback copy) `videos_processed.csv` + `channels_processed.csv` từ [DATA_DIR] vào sandbox. Skip nếu đã tồn tại.
- Sau run: glob `*.png` trong sandbox, đọc bytes, base64-encode, format `data:image/png;base64,...`. Cleanup PNG sau khi đọc.
- Cleanup `run.py` cuối cùng.
- Return field thêm `figures: list[str]`.

### 1.6 Wire [backend/app/api/execute.py](backend/app/api/execute.py)
- Nhận `ExecuteRequest{request_id, code}`. Detect edit: so sánh với `ai_code` từ DB → set `was_edited`, lưu `edited_code`.
- `await update_request_edit(request_id, edited_code, was_edited)`
- `await update_request_status(request_id, "executing")`
- `result = await executor.run_code(code, SANDBOX_DIR, timeout=30)`
- `await update_request_execution(request_id, result)` với final status `completed`/`failed`
- Return `ExecuteResponse{request_id, status, stdout, stderr, figures, execution_time_ms, error_message}`

### 1.7 Logger thêm methods
**File:** [backend/app/services/logger.py](backend/app/services/logger.py)
- `update_request_edit(id, edited_code, was_edited)`
- `update_request_status(id, status)`
- `update_request_execution(id, result_dict)` — lưu `stdout`, `stderr`, `figures`, `execution_time_ms`, `error_message`, `status` final, dồn vào `execution_result_json` blob để khớp schema hiện tại.
- `get_request(id)` → trả full row dict (cho /api/logs/{id})

### 1.8 [backend/app/api/logs.py](backend/app/api/logs.py)
- `GET /api/logs?status=&limit=&offset=` — đã list cơ bản, mở rộng filter status + pagination. Return `{total, items}`.
- `GET /api/logs/{id}` — gọi `get_request`, parse `execution_result_json`, trả full payload (prompt, ai_code, edited_code, was_edited, status, stdout, stderr, figures, execution_time_ms).

### 1.9 Schema migration nhẹ
**File:** [backend/app/db/schema.sql](backend/app/db/schema.sql)
- Thêm cột `was_edited BOOLEAN DEFAULT 0`. KHÔNG migrate sang multi-column như §4.6 vì `execution_result_json` blob đủ dùng và đỡ rủi ro DB drift.
- Vì DB đã tồn tại từ lần chạy trước, dùng `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (SQLite không hỗ trợ IF NOT EXISTS cho ADD COLUMN — workaround: query `PRAGMA table_info` rồi conditional ALTER trong `init_db`).

---

## Phase 2 — Frontend foundation

### 2.1 [frontend/lib/constants.ts](frontend/lib/constants.ts) (NEW)
- `CATEGORY_COLORS` đúng palette §5.1 (Kids amber, Gaming emerald, Music violet, …).
- `CATEGORIES = ["Kids","Gaming","Music","Comedy","Vlog","News","Education","Sports"]`
- `SUBSCRIBER_TIERS = ["Mega","Large","Mid"]`
- `DAY_LABELS = ["Mon","Tue",…,"Sun"]`
- Helper: `formatNumber(n)` → "1.2M" / "456K" / "1.2B" cho views; `formatPercent(p)`.

### 2.2 Mở rộng [frontend/lib/api.ts](frontend/lib/api.ts)
- Types: `OverviewData`, `ChannelsData`, `VideosData`, `FullSchema`, `GenerateResponse`, `ExecuteResponse`, `LogDetail`, `LogListResponse`.
- Endpoints: `overview(category?)`, `channels(filters)`, `videos(filters)`, `execute({request_id, code})`, `logDetail(id)`, `logs(filters)`, giữ `health`, `schema`, `generate`.

### 2.3 Thêm shadcn primitives còn thiếu
- `select`, `slider`, `switch`, `table`, `toggle`, `dropdown-menu` — qua `pnpm dlx shadcn@latest add ...`. Cập nhật vào [frontend/components/ui/](frontend/components/ui/).

### 2.4 Charts foundation
**Thư mục:** [frontend/components/charts/](frontend/components/charts/) (hiện chỉ có .gitkeep). **Tổng 11 components** map cho 13 chart MVP:

- `ChartCard.tsx` — wrapper title + description + loading + error fallback.
- **Recharts (static, nhanh, SSR ok):**
  - `PieDonut.tsx` (Chart A1) — onClick slice → callback cho cross-filter Overview
  - `LineChart.tsx` (Chart A2 view by year, F1 commercial monthly)
  - `StackedAreaChart.tsx` (Chart A3 short/long ratio by year) — **mới**
  - `StackedBarChart.tsx` (Chart B2 short vs long by year/quarter) — **mới**
  - `BarChart.tsx` — generic, hỗ trợ horizontal & color-by-key (Chart F2 commercial vs not, fallback cho các bar khác)
  - `TopVideosTable.tsx` (Chart D2 top 15 viral) — **mới**, kết hợp bảng + horizontal bar
- **Plotly (interactive — bắt buộc dynamic import `ssr:false`):**
  - `HeatmapPlotly.tsx` (Chart B1 channel×year, E2 dow×hour) — colorscale green
  - `BoxPlotly.tsx` (Chart C1 view by category, E1 engagement by duration×tier)
  - `ScatterPlotly.tsx` (Chart C2 sub vs avg view, D1 view vs lvr suspect log-x)
- Pattern dynamic import:
  ```ts
  const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
  ```

### 2.5 Dashboard primitives
- [frontend/components/dashboard/KPICard.tsx](frontend/components/dashboard/KPICard.tsx) — label + value + optional sub-text
- [frontend/components/dashboard/InsightCard.tsx](frontend/components/dashboard/InsightCard.tsx) — icon 💡 + title + content; nền `bg-emerald-500/10`
- [frontend/components/dashboard/FilterBar.tsx](frontend/components/dashboard/FilterBar.tsx) — generic, accept children + reset button

### 2.6 Cross-filter context
**File:** `frontend/app/(overview)/CategoryFilterContext.tsx` (hoặc inline trong page.tsx)
- React `createContext` cho `selectedCategory: string | null` + setter.
- Provider bao Overview page; chart Pie consume setter, các chart khác consume value.
- KHÔNG dùng global Zustand vì chỉ 1 page cần — ContextAPI vừa đủ.

### 2.7 Sidebar update — 8 nav items
**File:** [frontend/components/dashboard/Sidebar.tsx](frontend/components/dashboard/Sidebar.tsx)
- Thêm 4 nav items mới (icons Lucide):
  - `/short-form` — `TrendingUp`
  - `/anomaly` — `AlertTriangle`
  - `/interaction` — `Heart`
  - `/economy` — `ShoppingCart`
- Đổi icon cho route hiện có nếu cần: `/` (LayoutDashboard), `/channels` (Users), `/ai` (Sparkles), `/logs` (ScrollText).
- Tổng sidebar: **8 items** (6 dashboard + AI + Logs).

### 2.8 Next.js 16 compliance
- Trước khi viết bất kỳ trang Server Component nào: đọc `frontend/node_modules/next/dist/docs/` để check breaking changes (theo cảnh báo [frontend/AGENTS.md](frontend/AGENTS.md)).
- Đặc biệt verify: `dynamic()` import API, async page params, `searchParams` typing trong Next 16.

---

## Phase 3 — Dashboard pages (13 charts MVP, 6 page map 5 RO + Tổng Quan)

### 3.1 `/` Tổng Quan — REWRITE [frontend/app/page.tsx](frontend/app/page.tsx)
- 4 KPI: Tổng kênh (56), Tổng video (30,778), Tổng views, Tỉ lệ short-form
- 3 charts:
  - **A1** PieDonut: phân bố category (8 mục, 7 kênh đều)
  - **A2** LineChart: tổng view theo năm 2015–2026, highlight 2022+
  - **A3** StackedAreaChart: % short-form vs long-form theo năm
- **Cross-filter:** click slice A1 → set CategoryFilterContext → A2, A3 re-fetch với `?category=`
- InsightCard: *"30,778 video từ 56 kênh trải dài 11 năm. Bùng nổ thật sự bắt đầu từ 2022; short-form vượt mốc 50% từ 2024."*

### 3.2 `/short-form` (RO1) — NEW `frontend/app/short-form/page.tsx`
- FilterBar: year range slider (2015–2026), Select channel_category (All + 8)
- 2 charts:
  - **B1** HeatmapPlotly: kênh × năm với màu = `short_form_ratio` (sort kênh theo ratio)
  - **B2** StackedBarChart: số video short vs long theo năm/quý
- Gọi `GET /api/data/short-form?year_from=&category=`
- InsightCard: *"Comedy có tỉ lệ short-form cao nhất (62.8%), Vlog thấp nhất (13.4%). Vài kênh xoay trục từ ~0% → ~90% chỉ trong 2 năm."*

### 3.3 `/channels` (RO2) — REWRITE [frontend/app/channels/page.tsx](frontend/app/channels/page.tsx)
- FilterBar: Select channel_category (All + 8) + Select subscriber_tier (All + Mid/Large/Mega)
- 2 charts:
  - **C1** BoxPlotly: view/video theo channel_category (median + outliers)
  - **C2** ScatterPlotly: subscriber_count (log) vs avg_views_per_video_dataset, size = video_count_dataset, color = category
- Gọi `GET /api/data/channels?category=&tier=`
- InsightCard: *"Kids có median view thấp nhưng outlier cực cao — vài video viral kéo cả kênh. Mega không phải luôn đứng đầu avg view."*

### 3.4 `/anomaly` (RO3) — NEW `frontend/app/anomaly/page.tsx`
- FilterBar: Select channel_name (All + 56), year range slider
- 2 charts:
  - **D1** ScatterPlotly: x = view_count log, y = like_view_ratio, color = `suspect_fake_view`; tooltip: title + channel
  - **D2** TopVideosTable: top 15 viral (`is_viral=True`, sort view desc) — bảng + horizontal bar mini
- Gọi `GET /api/data/anomaly?channel_id=&year_from=&year_to=`
- InsightCard: *"Top viral: FLife TV 620M views. Music & Kids chiếm áp đảo viral count (123 + 138). Một số video view rất cao nhưng like_view_ratio bất thường thấp."*

### 3.5 `/interaction` (RO4) — NEW `frontend/app/interaction/page.tsx`
- FilterBar: multi-select channel_category, dropdown duration_group (All + Short/Medium/Long)
- 2 charts:
  - **E1** BoxPlotly: engagement_rate theo duration_group, breakdown subscriber_tier (3 tier)
  - **E2** HeatmapPlotly: day_of_week × hour_posted vs avg view_count (ghi chú UTC → GMT+7)
- Gọi `GET /api/data/interaction?categories=&duration_group=`
- InsightCard: *"Giờ vàng 11h–12h trưa. Gaming có engagement cao nhất (1.88%) dù tỉ lệ short-form thấp. Kiểm định Mid > Mega về engagement_rate?"*

### 3.6 `/economy` (RO5) — NEW `frontend/app/economy/page.tsx`
- FilterBar: year-month range (mặc định 2024-01 → 2026-05), multi-select channel_category
- 2 charts:
  - **F1** LineChart: số video `is_commercial=True` theo tháng, vertical reference line tại 2024-10 (YouTube Shopping ra mắt VN)
  - **F2** BarChart grouped: avg view_count commercial vs non-commercial theo category; bảng phụ top 10 kênh theo `commercial_count`
- Gọi `GET /api/data/economy?year_from=&categories=`
- InsightCard: *"YouTube Shopping ra mắt 10/2024 — số video commercial tăng rõ rệt. Engagement video commercial khác biệt so với nội dung thuần."*

### 3.7 Backend filter strategy
- Frontend debounce 300ms khi user thay filter (slider/multi-select) trước khi gọi API
- Backend luôn trả **aggregate data đã filter** (không bao giờ trả 30k row raw — hiệu năng)
- Cross-filter Overview: Pie A1 emit `category` qua React Context → A2, A3 hooks dùng SWR-style refetch với key bao gồm category

---

## Phase 4 — AI Module (TRỌNG TÂM, Tiêu chí 8 — Rất quan trọng)

### 4.1 [frontend/components/ai/](frontend/components/ai/) (NEW)
- `ChatInput.tsx` — Textarea + Submit button + loading spinner. onSubmit prop.
- `CodeBlock.tsx` — `@monaco-editor/react` với dynamic import `ssr:false`, `language="python"`, `theme="vs-dark"`, height auto. Props: `value`, `onChange`, `readOnly`. Khi user gõ → emit `was_edited=true`.
- `StatusBadge.tsx` — màu theo state: pending (zinc), edited (amber), approved (blue), executing (violet pulse), completed (emerald), failed (red), rejected (zinc strike).
- `ResultPanel.tsx` — render `figures.map(src => <img src={src}>)`, `<pre>{stdout}</pre>`, execution_time, error_message.

### 4.2 [frontend/app/ai/page.tsx](frontend/app/ai/page.tsx) — REWRITE state machine
- Client component (`"use client"`).
- State: `request: {id, ai_code, edited_code, explanation, status} | null`, `result: ExecuteResponse | null`, loading flags.
- Flow:
  1. ChatInput submit → POST `/api/ai/generate` → set `request.status="pending"`, `ai_code` vào Monaco.
  2. User gõ Monaco → set `edited_code`, status thành `edited` (chỉ UI).
  3. Click Approve → POST `/api/execute` với `{request_id, code: edited_code ?? ai_code}` → status `executing` → khi response về set `completed`/`failed` + result.
  4. Click Reject → set status `rejected` UI-side; (optional gọi backend update — không bắt buộc trong DoD).
- Toast notifications (sonner) cho mỗi state transition.
- Hiển thị `explanation` panel ngay trên code block.

### 4.3 Verify Monaco với Next.js 16
- Đọc `node_modules/@monaco-editor/react/README` + thử `next dev` với một dummy CodeBlock trước khi tích hợp đầy đủ. Plotly + Monaco đều SSR-unfriendly nên test trước.

---

## Phase 5 — Logs page

### 5.1 [frontend/app/logs/page.tsx](frontend/app/logs/page.tsx) — REWRITE
- Server component fetch `GET /api/logs?status=&limit=20`.
- Table (shadcn): created_at, prompt (truncate), status (StatusBadge), execution_time_ms, has_figures icon.
- Click row → navigate `/logs/[id]` (dynamic route) HOẶC mở Dialog inline.

### 5.2 [frontend/app/logs/[id]/page.tsx](frontend/app/logs/[id]/page.tsx) (NEW)
- Hiển thị: prompt, ai_code (Monaco readOnly), edited_code (chỉ khi `was_edited`, side-by-side hoặc tab), reuse `ResultPanel` cho stdout/figures, status badge, execution_time.

---

## Phase 6 — Polish & demo prep

### 6.1 README cập nhật
- Update [README.md](README.md): setup ≤ 5 lệnh + prerequisite "đặt CSV vào backend/data/" + `.env` GEMINI_API_KEY.

### 6.2 Smoke test theo 5 RO (§8 REQUIREMENTS.md)
- 5 câu sinh code map 1-1 với 5 RO + 1 câu meta. Verify mỗi câu:
  - Code có comment tiếng Việt
  - Không dùng cột bịa (chỉ schema injected)
  - `plt.savefig` + `matplotlib.use("Agg")` (không `plt.show()`)
  - Edit được trong Monaco, approve → figure render < 30s
  - Log ghi đầy đủ vào SQLite (prompt + ai_code + edited_code nếu có + figures + status)
- Câu test cụ thể (lấy từ REQUIREMENTS.md §8):
  - **RO1:** Heatmap short-form theo kênh × năm + top 5 kênh xoay trục
  - **RO2:** Median view 8 thể loại × 3 tier
  - **RO3:** Top 10 video suspect_fake_view
  - **RO4:** Heatmap day_of_week × hour_posted (giờ vàng)
  - **RO5:** Số video commercial theo tháng từ 2024-01, vertical line 2024-10

### 6.3 Lint + build
- `cd frontend && pnpm lint && pnpm build` — fix mọi lỗi trước demo.
- Backend: `python -m py_compile $(git ls-files backend/app/*.py)` (smoke).

---

## Critical files cần sửa/tạo (tổng hợp)

**Backend (sửa):**
- [backend/app/api/data.py](backend/app/api/data.py) — rewrite
- [backend/app/api/execute.py](backend/app/api/execute.py) — wire executor
- [backend/app/api/logs.py](backend/app/api/logs.py) — thêm GET /{id}, filter
- [backend/app/services/llm/gemini.py](backend/app/services/llm/gemini.py) — real call
- [backend/app/services/llm/prompts.py](backend/app/services/llm/prompts.py) — schema injection
- [backend/app/services/executor.py](backend/app/services/executor.py) — copy CSV + base64 figures
- [backend/app/services/logger.py](backend/app/services/logger.py) — update methods
- [backend/app/main.py](backend/app/main.py) — load data_store ở lifespan
- [backend/app/db/schema.sql](backend/app/db/schema.sql) — thêm `was_edited`

**Backend (tạo):**
- [backend/app/services/data_store.py](backend/app/services/data_store.py)

**Frontend (sửa):**
- [frontend/app/page.tsx](frontend/app/page.tsx) — Overview
- [frontend/app/ai/page.tsx](frontend/app/ai/page.tsx) — full flow
- [frontend/app/logs/page.tsx](frontend/app/logs/page.tsx) — table + filter
- [frontend/lib/api.ts](frontend/lib/api.ts) — mở rộng types/endpoints
- [frontend/components/dashboard/Sidebar.tsx](frontend/components/dashboard/Sidebar.tsx) — thêm nav

**Frontend (sửa thêm):**
- [frontend/app/channels/page.tsx](frontend/app/channels/page.tsx) — đổi nội dung sang RO2

**Frontend (tạo):**
- [frontend/lib/constants.ts](frontend/lib/constants.ts)
- `frontend/app/short-form/page.tsx` (RO1)
- `frontend/app/anomaly/page.tsx` (RO3)
- `frontend/app/interaction/page.tsx` (RO4)
- `frontend/app/economy/page.tsx` (RO5)
- [frontend/app/logs/[id]/page.tsx](frontend/app/logs/[id]/page.tsx)
- [frontend/components/charts/](frontend/components/charts/) — 11 components (PieDonut, LineChart, StackedAreaChart, StackedBarChart, BarChart, TopVideosTable, HeatmapPlotly, BoxPlotly, ScatterPlotly, ChartCard, + 1 dự phòng)
- [frontend/components/dashboard/KPICard.tsx](frontend/components/dashboard/KPICard.tsx)
- [frontend/components/dashboard/InsightCard.tsx](frontend/components/dashboard/InsightCard.tsx)
- [frontend/components/dashboard/FilterBar.tsx](frontend/components/dashboard/FilterBar.tsx)
- [frontend/components/ai/ChatInput.tsx](frontend/components/ai/ChatInput.tsx)
- [frontend/components/ai/CodeBlock.tsx](frontend/components/ai/CodeBlock.tsx)
- [frontend/components/ai/StatusBadge.tsx](frontend/components/ai/StatusBadge.tsx)
- [frontend/components/ai/ResultPanel.tsx](frontend/components/ai/ResultPanel.tsx)

> **Lưu ý:** KHÔNG tạo `frontend/app/videos/page.tsx` — kế hoạch cũ đã thay bằng `/anomaly` + `/interaction` (chia chart từ `/videos` cũ sang 2 trang RO).

---

## Verification plan (end-to-end)

**Backend smoke:**
```powershell
conda activate vn-dataviz-ai
cd backend
uvicorn app.main:app --reload
# Trong terminal khác:
curl http://localhost:8000/health
curl http://localhost:8000/api/data/schema | head -50
curl "http://localhost:8000/api/data/overview"
curl "http://localhost:8000/api/data/overview?category=Music"
curl "http://localhost:8000/api/data/short-form?year_from=2020"
curl "http://localhost:8000/api/data/channels?tier=Mega"
curl "http://localhost:8000/api/data/anomaly?year_from=2024"
curl "http://localhost:8000/api/data/interaction?categories=Gaming,Music"
curl "http://localhost:8000/api/data/economy?year_from=2024-01"
```
- Schema phải khớp 37 cols videos + 25 cols channels.
- Overview KPIs: 56 channels, 30,778 videos, sum view_count > 50B.

**AI flow smoke:**
```powershell
# Set GEMINI_API_KEY trong .env trước
curl -X POST http://localhost:8000/api/ai/generate `
  -H "Content-Type: application/json" `
  -d '{"prompt":"So sánh engagement rate giữa 8 category"}'
# Lấy request_id từ response, rồi:
curl -X POST http://localhost:8000/api/execute `
  -H "Content-Type: application/json" `
  -d '{"request_id":"<id>","code":"<code-from-generate>"}'
```
- Response `figures` phải có ít nhất 1 chuỗi `data:image/png;base64,...`.
- `GET /api/logs/<id>` trả full record.

**Frontend smoke (manual, 8 routes):**
```powershell
cd frontend
pnpm dev
```
1. `/` Tổng Quan: 4 KPI có số thật, 3 charts render (A1, A2, A3); click slice Music trong A1 → A2 + A3 filter theo Music.
2. `/short-form` (RO1): heatmap B1 hiển thị 56 kênh × 12 năm; B2 stacked bar đổi khi kéo year slider.
3. `/channels` (RO2): C1 box plot 8 category; C2 scatter 56 điểm với log-x.
4. `/anomaly` (RO3): D1 scatter điểm đỏ (suspect_fake_view) tách rõ; D2 top 15 viral khớp dataset (FLife TV, Sơn Tùng).
5. `/interaction` (RO4): E1 box engagement breakdown 3 tier; E2 heatmap 7×24 với cell sáng nhất ~11h.
6. `/economy` (RO5): F1 line có vertical line tại 2024-10; F2 bar grouped commercial vs not.
7. `/ai`: gõ "RO5 — Số video commercial từ 2024-01 theo tháng" → code có comment VN → edit → Approve → figure render < 30s.
8. `/logs`: thấy request vừa rồi với status `completed`, click vào → detail có figure base64.

**Tiêu chí pass:**
- DoD §11: ≥13/15 charts, KPI đúng, cross-filter Overview, AI flow đầy đủ, logs có dữ liệu, `/health` 200.
- 6 câu hỏi vấn đáp §8: 5/6 RO sinh code chạy được trong sandbox.
- Mỗi page dashboard có InsightCard 1-1 với 1 RO.
- Không lỗi nghiêm trọng frontend console; `pnpm build` pass.

---

## Mở rộng giai đoạn 2 (sau khi MVP pass)

Nếu còn thời gian sau khi đạt DoD, bổ sung 2 chart để cộng dồn lên 15/15:
- **RO1 mở rộng:** Bảng top 5 kênh "xoay trục" — diff `short_form_ratio` (year≥2024) − (year<2020), sort desc
- **RO2 mở rộng:** Line `median_views_per_video` theo năm cho mỗi category (8 đường)
- **RO5 mở rộng:** Tách F2 thành 2 chart riêng (avg view + avg engagement)
- **RO4 mở rộng:** Scatter `tag_count` vs `engagement_rate` (sampled 2000 điểm)
- Cross-filter mở rộng cho `/channels`, `/short-form` (chia sẻ category state qua URL searchParams)
- Theme toggle (dark/light) + persistence
- Diff view ai_code vs edited_code trong log detail (Monaco diff editor)
- Multi-turn conversation cho AI (truyền `history` vào prompt)
