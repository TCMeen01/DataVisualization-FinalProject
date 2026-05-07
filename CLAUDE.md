# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Source-of-truth hierarchy

The repo has multiple spec files that disagree with each other. Read them in this priority order:

1. **`REQUIREMENTS.md`** — current, authoritative spec. Defines the project as a **Vietnam YouTube Analytics Dashboard + AI Module** built on `videos_processed.csv` (30,778 rows) and `channels_processed.csv` (56 rows) from a Kaggle dataset. This supersedes earlier docs.
2. **`INIT.md`** — original scaffold spec. Useful for the initial structure rationale, but its "generic VN data" framing has been replaced by the YouTube focus in `REQUIREMENTS.md`. Where they conflict, `REQUIREMENTS.md` wins.
3. **`README.md`** — quick run instructions; trust over `INIT.md` for setup commands.
4. `docs/architecture.md`, `docs/api-spec.md`, `docs/design-system.md` for deeper detail.

When `INIT.md` says one thing (e.g. `uv` for Python, Next.js 15) and the actual repo says another (conda + `pip install -r requirements.txt`, Next.js 16), **the repo is correct** — `INIT.md` was a plan that drifted.

## Core principles (non-negotiable)

These are encoded in `REQUIREMENTS.md` §2 and must be respected by any code change:

- **Human-in-the-loop.** AI suggests code; it never executes on its own. Code passes through `pending → (edited) → approved → executed → completed/failed`. The Approve button is the only path to execution.
- **No silent execution.** AI-generated code must be visible in the UI before running, with Vietnamese-language step comments.
- **Local execution only.** Code runs via `subprocess` in `backend/sandbox/`, not in any cloud sandbox. Honor the `timeout` and the no-network/no-`os.system`/no-`subprocess` rules in the LLM system prompt.
- **Full audit trail.** Every request, code, edit, and result is logged to SQLite (`backend/logs.db`).
- **No hallucinated data.** The LLM may only reference columns present in the schema injected into its system prompt.

## Common commands

Two terminals are required for dev. Backend uses conda (env name: `vn-dataviz-ai`).

**Backend (port 8000):**
```powershell
conda activate vn-dataviz-ai
cd backend
pip install -r requirements.txt   # first time only
uvicorn app.main:app --reload
```
Health check: `GET http://localhost:8000/health` → `{"ok": true}`. SQLite (`logs.db`) is auto-created on startup via the FastAPI `lifespan` hook in `backend/app/main.py`.

**Frontend (port 3000):**
```powershell
cd frontend
pnpm install   # first time only
pnpm dev
pnpm lint      # eslint
pnpm build     # production build
```

**Env:** copy `.env.example` to `.env` at repo root and fill `GEMINI_API_KEY`. `backend/app/config.py` reads from both `./.env` and `../.env`, so the file works from either the repo root or `backend/`.

## Architecture

Two independent processes talk over HTTP:

```
Next.js 16 (3000)  ── fetch ──▶  FastAPI (8000)
  app/, components/                api/{ai,execute,logs,data}
  lib/api.ts                       services/{llm/, executor, logger}
                                   ├─ SQLite logs.db
                                   ├─ subprocess in sandbox/
                                   └─ data/*.csv
```

### Backend (`backend/app/`)

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