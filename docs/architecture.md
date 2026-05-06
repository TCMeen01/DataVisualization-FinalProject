# Architecture

## Tổng quan

Hai service chạy local, giao tiếp qua HTTP/JSON:

- **Frontend** — Next.js 16 (App Router), Tailwind 4, shadcn/ui. Render dashboard, AI workspace, logs.
- **Backend** — FastAPI + Python 3.11. Sinh code (qua LLM), chạy code trong sandbox, lưu log SQLite.

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
