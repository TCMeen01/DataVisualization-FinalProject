# Vietnam YouTube Analytics Dashboard

Dashboard trực quan hóa dữ liệu YouTube Việt Nam + module AI hỗ trợ phân tích theo mô hình **Human-in-the-loop**.

Phân tích 30,778 video từ 56 kênh YouTube hàng đầu Việt Nam (2019-2024) với AI-powered code generation.

## Prerequisites

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:

- **conda** (Miniconda hoặc Anaconda) — để quản lý Python environment
- **Node.js 18+** và **pnpm** — cho frontend
- **CSV files** — đặt `videos_processed.csv` và `channels_processed.csv` vào `backend/data/`
- **.env file** — tạo file `.env` ở thư mục gốc với `GEMINI_API_KEY=your_key_here`

## Setup

Chỉ cần 5 lệnh để chạy toàn bộ ứng dụng:

```powershell
# 1. Kích hoạt conda environment (tạo trước: conda create -n vn-dataviz-ai python=3.11)
conda activate vn-dataviz-ai

# 2. Cài đặt dependencies cho backend
cd backend && pip install -r requirements.txt

# 3. Chạy backend (port 8000)
uvicorn app.main:app --reload

# Mở terminal mới:
# 4. Cài đặt dependencies cho frontend
cd frontend && pnpm install

# 5. Chạy frontend (port 3000)
pnpm dev
```

Truy cập: **http://localhost:3000**

## Project Structure

```
.
├── backend/             # FastAPI + Python 3.11
│   ├── app/
│   │   ├── api/         # 4 routers: ai, execute, logs, data
│   │   ├── services/    # llm/, executor, logger, data_store
│   │   └── db/          # SQLite schema
│   ├── data/            # CSV files (gitignored)
│   └── sandbox/         # Code execution environment
├── frontend/            # Next.js 16 + React 19 + Tailwind 4
│   ├── app/             # 8 routes: /, /short-form, /channels, /anomaly, /interaction, /economy, /ai, /logs
│   ├── components/      # ui/, dashboard/, ai/, charts/
│   └── lib/api.ts       # Typed API client
├── REQUIREMENTS.md      # Full project specification
├── PLAN.md              # Implementation roadmap
└── .env                 # GEMINI_API_KEY (create from .env.example)
```

## Features

### 📊 Dashboard (6 pages, 13+ charts)
- **Overview**: KPIs, category distribution, views by year, short-form ratio
- **Short-form**: Heatmap by channel/year, stacked bar chart
- **Channels**: Box plot by category, scatter plot subscriber vs views
- **Anomaly**: Suspect fake views detection, viral videos table
- **Interaction**: Engagement rate analysis, golden hour heatmap
- **Economy**: Commercial video trends, revenue analysis

### 🤖 AI Module
- Natural language → Python code generation (Gemini)
- Monaco editor with syntax highlighting
- Human-in-the-loop approval workflow
- Sandboxed execution with figure rendering
- Full audit trail in SQLite

### 📝 Logs
- Request history with filtering and pagination
- Detailed view with code comparison (AI vs edited)
- Execution results with figures and stdout/stderr

## Verification & Testing

**Pre-demo verification guide**: [VERIFICATION.md](VERIFICATION.md)

Automated verification scripts (< 10 minutes total):
- **Backend smoke tests**: `backend/verify_backend.ps1` (9 endpoint checks)
- **AI flow verification**: `tests/verify_ai_flow.ps1` (end-to-end AI workflow)
- **RO test cases**: `tests/verify_ro_tests.ps1` (5 Research Objective tests)
- **Frontend checklist**: `frontend/VERIFICATION_CHECKLIST.md` (manual, ~5 min)

Quick verification:
```powershell
# Backend
cd backend && .\verify_backend.ps1

# AI + RO tests
cd ..\tests && .\verify_ai_flow.ps1 && .\verify_ro_tests.ps1

# Frontend
cd ..\frontend && pnpm lint && pnpm build
```

See [VERIFICATION.md](VERIFICATION.md) for detailed instructions, expected outputs, and troubleshooting.

## Links

- **Full Specification**: [REQUIREMENTS.md](REQUIREMENTS.md)
- **Implementation Plan**: [PLAN.md](PLAN.md)
- **Architecture**: [docs/architecture.md](docs/architecture.md)
- **API Spec**: [docs/api-spec.md](docs/api-spec.md)
- **Design System**: [docs/design-system.md](docs/design-system.md)

## Tech Stack

**Backend**: FastAPI, Python 3.11, SQLite, Google Gemini API, pandas, matplotlib  
**Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts, Plotly, Monaco Editor

## License

Educational project for Data Visualization course.
