# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Source-of-truth hierarchy

The repo has multiple spec files that disagree with each other. Read them in this priority order:

1. **`REQUIREMENTS.md`** — current, authoritative spec. Defines the project as a **Hanoi Air Quality (PM2.5) Analytics Dashboard + AI Module** built on `hanoi_aqi_ml_ready_fixed.csv` (~14,451 rows of hourly PM2.5 + weather data from 2024–2026). This is the single source of truth.
2. **`README.md`** — quick run instructions and feature overview.
3. `docs/architecture.md`, `docs/api-spec.md`, `docs/design-system.md` for architectural and API details.
4. `PLAN.md` — implementation roadmap and phasing.

When in doubt, **`REQUIREMENTS.md`** wins. It contains the complete specification including:
- 5 Research Objectives (RO1–RO5) mapping 1-1 to 5 dashboard pages
- 15 charts MVP (Overview 3 + 5 RO × 3)
- AI Module spec with Human-in-the-loop (pending → approved → executed → logged)
- SQLite schema, API endpoints, system prompt for LLM
- Design system with AQI colors + Season colors
- Tech stack: FastAPI (backend), Next.js 16 (frontend), Gemini 2.0 Flash (LLM), SQLite (logs)

## Core principles (non-negotiable)

These are encoded in `REQUIREMENTS.md` §4–§5 and must be respected by any code change:

- **Human-in-the-loop (HITL).** AI suggests code + explanation; it never executes on its own. Code lifecycle: `pending → approved/rejected → executing → completed/failed`. The Approve button is the **only** path to execution. Users can edit code before approving.
- **No silent execution.** AI-generated code must be visible in the UI (Monaco Editor) before running, with **Vietnamese-language comments** explaining each step. User sees exactly what will run.
- **Local execution only.** Code runs via `subprocess` in `backend/sandbox/`, not in any cloud sandbox. Enforce the no-network/no-`os.system`/no-`subprocess` rules in the LLM system prompt (REQUIREMENTS.md §4.3). Timeout: 30 seconds.
- **Full audit trail.** Every request (user prompt), AI response (code + explanation), edit, approval, and execution result is logged to SQLite (`backend/logs.db`). See schema in REQUIREMENTS.md §4.6.
- **No hallucinated data.** The LLM may **ONLY** reference columns/statistics present in the schema injected into its system prompt (REQUIREMENTS.md §4.3). Cannot reference PM2.5 columns that don't exist, must NOT make up data.

## Common commands

Two terminals are required for dev. Backend uses conda (env name: `vn-dataviz-ai`). Frontend uses `pnpm`.

**Backend (port 8000):**
```powershell
conda activate vn-dataviz-ai
cd backend
pip install -r requirements.txt   # first time only
uvicorn app.main:app --reload
```
Health check: `GET http://localhost:8000/health` → `{"ok": true}`. 
SQLite (`logs.db`) is auto-created on startup via the FastAPI `lifespan` hook in `backend/app/main.py` (see REQUIREMENTS.md §4.4).

**Frontend (port 3000):**
```powershell
cd frontend
pnpm install   # first time only
pnpm dev       # dev server
pnpm lint      # eslint
pnpm build     # production build
```

**Env setup:**
1. Copy `.env.example` to `.env` at repo root
2. Fill `GEMINI_API_KEY=your_gemini_key_here`
3. Ensure `hanoi_aqi_ml_ready_fixed.csv` is in `backend/data/`
4. `backend/app/config.py` reads from both `./.env` and `../.env`, so the file works from either the repo root or `backend/` folder

**Data:**
Download `hanoi_aqi_ml_ready_fixed.csv` from Kaggle ([Hanoi Air Quality 2024-2026](https://www.kaggle.com/datasets/diabolicfox/hanoi-air-quality-pm2-5-weather-data-2024-2026)) and place it in `backend/data/`. The file is ~14,451 rows, contains hourly PM2.5 + weather data (temp, humidity, wind, pressure, precip).

## Architecture

Two independent processes communicate over HTTP/JSON:

```
Next.js 16 (3000)  ── POST/GET ──▶  FastAPI (8000)
  app/                              api/{ai,execute,logs,data}
  components/                       services/{llm/, executor, logger}
  lib/api.ts                        data_store (in-memory cache)
                                    ├─ SQLite logs.db
                                    ├─ subprocess in sandbox/
                                    └─ hanoi_air_quality.csv (cached on startup)
```

### Backend (`backend/app/`) — Air Quality Data Analysis

- `main.py` — FastAPI app. `lifespan` creates the sandbox dir + initializes SQLite from `db/schema.sql`. CORS is locked to `settings.FRONTEND_URL`.
- `api/` — four routers, all currently returning **mock data** per `INIT.md` §10. They are wired but not yet backed by real logic:
  - `ai.py` → `POST /api/ai/generate` (calls `GeminiClient.generate`, persists request to SQLite as `pending`).
  - `execute.py` → `POST /api/execute` (mock; does not yet call `services/executor.py`).
  - `logs.py` → `GET /api/logs`, `GET /api/logs/{id}`.
  - `data.py` → `GET /api/data/schema`, `GET /api/data/preview`.
- `services/llm/` — LLM is abstracted behind `base.LLMClient`. Today only `GeminiClient` exists and it is a **stub** (returns canned code/explanation; does not call Gemini). Swap implementations through this interface, not by editing call sites. System prompts go in `prompts.py`.
- `services/executor.py` — async `subprocess` runner that writes `run.py` into the sandbox, executes with timeout, and returns `{status, stdout, stderr, execution_time_ms}`. Currently **not yet wired** into `api/execute.py`.
- `services/logger.py` — `aiosqlite` wrapper. `init_db()` runs `db/schema.sql`. Status enum: `pending|edited|approved|executed|completed|failed|rejected`.
- `models/` — Pydantic request/response schemas. The API contract lives here; align changes with `REQUIREMENTS.md` §4.5.
- `config.py` — `pydantic-settings`. Defaults: `SANDBOX_DIR=./sandbox`, `DB_PATH=./logs.db`, `FRONTEND_URL=http://localhost:3000`.

### Frontend (`frontend/`)

- **Next.js 16 + React 19 + Tailwind 4 + shadcn.** This is **not** the Next.js most training data describes — `frontend/AGENTS.md` (loaded via `frontend/CLAUDE.md`) explicitly warns: *"APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."* Do this before touching frontend code.
- `app/` — App Router with three pages: `/` (dashboard), `/ai` (chat + Monaco editor + Approve/Reject), `/logs` (request history). Layout sits in `app/layout.tsx`.
- `components/` — split into `ui/` (shadcn primitives), `dashboard/`, `ai/` (`ChatInput`, `CodeBlock`, `ResultPanel`, `StatusBadge`), `charts/` (Recharts + Plotly wrappers).
- `lib/api.ts` — typed fetch wrapper. `BASE` defaults to `http://localhost:8000` and is overridden by `NEXT_PUBLIC_API_URL`. All backend calls should go through this module.

### Data flow for an AI-assisted analysis

1. User types a prompt in `/ai`. Frontend posts to `/api/ai/generate` with prompt + (eventually) a `data_context` snapshot derived from `/api/data/schema`.
2. Backend calls `GeminiClient.generate`, generates `{code, explanation}`, inserts a `pending` row into `requests`, returns `request_id` to UI.
3. UI shows the code in Monaco. User can edit; status becomes `edited`. User clicks Approve.
4. Frontend posts code to `/api/execute`. Backend will (once wired) call `executor.run_code` against `sandbox/`, capture stdout/stderr/figures, and update the row to `completed` or `failed`.
5. `/logs` reads from SQLite for the audit trail.

## Conventions worth knowing

- All AI-generated Python code must use `matplotlib.use("Agg")` and `plt.savefig(...)` — **never** `plt.show()` (no display in subprocess). The system prompt enforces this; preserve it when editing prompts.
- The sandbox is the **only** writable path for generated code. Reject changes that let generated code escape `./` or import `os.system`/`subprocess`/network libs.
- Vietnamese is the user-facing language for prompts, code comments, and explanations. Keep it that way in LLM prompts and UI strings.
- The dataset is gitignored except for `data/sample.csv`. The real `videos_processed.csv` / `channels_processed.csv` are expected to be placed locally; do not commit them.