# vn-dataviz-ai

Dashboard trực quan hóa dữ liệu Việt Nam + module AI hỗ trợ phân tích theo mô hình **Human-in-the-loop**.

Đọc [INIT.md](INIT.md) để biết toàn bộ ngữ cảnh, principles và roadmap.

## Kiến trúc nhanh

```
+------------------+        HTTP        +-------------------+
|  Next.js 16 (3000)| <----------------> |  FastAPI (8000)   |
|  - /              |                    |  - /api/ai        |
|  - /ai            |                    |  - /api/execute   |
|  - /logs          |                    |  - /api/logs      |
|  - shadcn + Tailwind                   |  - /api/data      |
+------------------+                    +---------+---------+
                                                  |
                                                  v
                                         SQLite (logs.db)
                                         sandbox/ (subprocess)
                                         data/sample.csv
```

## Yêu cầu hệ thống

- Node.js >= 20
- pnpm >= 10
- Python 3.11 (qua conda env)
- conda (Miniconda/Anaconda)

## Setup lần đầu

### 1. Backend (Python via conda)

```powershell
# Tạo env (đã làm sẵn ở máy init): conda create -n vn-dataviz-ai -c conda-forge python=3.11 -y
conda activate vn-dataviz-ai
cd backend
pip install -r requirements.txt
copy ..\.env.example ..\.env   # rồi điền GEMINI_API_KEY nếu có
```

### 2. Frontend

```powershell
cd frontend
pnpm install
```

## Chạy dev

Mở 2 terminal song song:

**Terminal 1 — Backend (port 8000):**

```powershell
conda activate vn-dataviz-ai
cd backend
uvicorn app.main:app --reload
```

Kiểm tra: http://localhost:8000/health → `{"ok": true}`

**Terminal 2 — Frontend (port 3000):**

```powershell
cd frontend
pnpm dev
```

Mở: http://localhost:3000

## Cấu trúc

```
.
├── INIT.md              # Spec gốc của đồ án
├── DESIGN.md            # Design system tham chiếu (Cohere)
├── README.md
├── .env.example
├── backend/             # FastAPI + Python 3.11
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/         # 4 routers: ai, execute, logs, data
│   │   ├── services/    # llm/, executor, logger
│   │   ├── models/      # pydantic schemas
│   │   └── db/schema.sql
│   ├── data/sample.csv
│   ├── sandbox/
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/            # Next.js 16 + Tailwind 4 + shadcn
│   ├── app/             # /, /ai, /logs
│   ├── components/      # ui/, dashboard/, ai/, charts/
│   └── lib/api.ts
└── docs/
    ├── architecture.md
    ├── api-spec.md
    └── design-system.md
```

## API endpoints (giai đoạn init: trả mock)

| Method | Path                   | Mục đích                          |
|--------|------------------------|----------------------------------|
| GET    | `/health`              | Health check                      |
| POST   | `/api/ai/generate`     | Sinh code Python từ prompt       |
| POST   | `/api/execute`         | Chạy code đã approve             |
| GET    | `/api/logs`            | Danh sách request                 |
| GET    | `/api/logs/{id}`       | Chi tiết 1 request                |
| GET    | `/api/data/schema`     | Schema dataset                    |
| GET    | `/api/data/preview`    | Preview rows                      |

Chi tiết schema xem `docs/api-spec.md`.

## Verify checklist (Definition of Done — INIT §11)

- [ ] `uvicorn app.main:app --reload` chạy được, `GET /health` trả `{"ok": true}`
- [ ] `pnpm dev` chạy được, mở `http://localhost:3000` thấy 3 page render
- [ ] Frontend gọi `GET /api/data/schema` (mock) và hiển thị schema
- [ ] SQLite `logs.db` được tạo tự động khi backend khởi động
- [ ] `git log` có ít nhất 1 commit
