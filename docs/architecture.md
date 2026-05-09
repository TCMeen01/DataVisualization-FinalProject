# Architecture — Hanoi Air Quality (PM2.5) Analytics Dashboard

## Tổng quan

Hai service chạy local, giao tiếp qua HTTP/JSON:

- **Frontend** — Next.js 16 (App Router), Tailwind 4, shadcn/ui. Render 6 dashboard pages (Overview + 5 RO), AI workspace, logs.
- **Backend** — FastAPI + Python 3.11. Sinh code Python (qua Google Gemini LLM), chạy code trong subprocess sandbox, lưu log SQLite.

## Project Scope — 5 Research Objectives (RO)

Mỗi trang dashboard map 1-1 với 1 RO:

| RO | Page | Insights | Charts |
|---|---|---|---|
| RO1 | `/seasonal` | Mùa đông ô nhiễm gấp 4 lần; độ ẩm r≈0 | Box plot + Scatter (temp/humidity vs PM2.5) |
| RO2 | `/hourly` | 7–9h & 19–21h tệ nhất; 14–18h an toàn | Polar bar (24h) + Heatmap (dow × hour) |
| RO3 | `/weather` | Chỉ gió có tác dụng; mưa r≈0 | Corr bar (all weather vars) + Scatter (wind vs PM2.5) |
| RO4 | `/trend` | Year-over-year loại bỏ mùa vụ | YoY line (cùng tháng) + Calendar heatmap |
| RO5 | `/weekend` | Weekday/weekend chênh <10% | Box plot (dow) + Hourly profile (weekday vs weekend) |

## Flow chính (Human-in-the-loop)

```
User
  │  1. nhập prompt
  ▼
Frontend (/ai)
  │  2. POST /api/ai/generate
  ▼
Backend.api.ai
  │  3. gọi LLMClient.generate()
  ▼
LLM (Gemini / mock)
  │  4. trả {code, explanation}
  ▼
Backend.logger.insert_request (status=pending)
  │
  ▼
Frontend hiển thị code + explanation
  │  5. user review/edit/approve
  ▼
Frontend POST /api/execute
  │
  ▼
Backend.api.execute → executor.run_code (subprocess, timeout)
  │
  ▼
Sandbox dir chạy script, sinh figures + tables
  │
  ▼
Trả response → frontend hiển thị
```

## Module chính

### Backend (`backend/app/`)

- `main.py` — FastAPI entry, mount routers, init DB on startup.
- `config.py` — `pydantic-settings` đọc `.env`.
- `api/` — 4 routers: `ai`, `execute`, `logs`, `data`.
- `services/llm/` — Abstract `LLMClient` + Gemini implementation. Prompt tiếng Việt ở `prompts.py`.
- `services/executor.py` — Subprocess runner với timeout, sandbox dir cách ly.
- `services/logger.py` — SQLite async (aiosqlite). Schema ở `db/schema.sql`.
- `models/` — Pydantic request/response schemas.

### Frontend (`frontend/`)

- `app/` — App Router pages (`/`, `/ai`, `/logs`) + root `layout.tsx`.
- `components/ui/` — shadcn primitives (button, card, dialog, …).
- `components/dashboard/Sidebar.tsx` — Sidebar navigation.
- `components/charts/` — Wrapper Recharts/Plotly (chưa implement giai đoạn init).
- `components/ai/` — Chat input, code block, status badge (chưa implement giai đoạn init).
- `lib/api.ts` — Fetch wrapper gọi backend.

## Boundary & invariants (BẮT BUỘC)

1. **AI không tự chạy code.** Mọi code đều ở `pending` → `approved` → `executed`.
2. **Code chạy ở subprocess local**, không gọi sandbox cloud.
3. **Mọi request được log SQLite** với prompt + code + result.
4. **LLM bị giới hạn schema**: chỉ dùng cột có trong `data_context`, không bịa số liệu.
