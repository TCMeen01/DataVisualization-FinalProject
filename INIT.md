# INIT.md — Vietnam Data Viz Dashboard + AI Module

> **Hướng dẫn dành cho Claude Code:** File này mô tả toàn bộ ngữ cảnh đồ án. Đọc kỹ trước khi init repo. Sau khi đọc xong, hãy thực hiện các task ở mục **§9 Init Tasks** theo đúng thứ tự.

---

## 1. Project Overview

**Tên:** `vn-dataviz-ai` (đề xuất, có thể đổi)

**Mục tiêu:** Xây dựng một **dashboard trực quan hóa dữ liệu Việt Nam** kèm **module AI hỗ trợ phân tích** theo mô hình **Human-in-the-loop**.

**2 phần chính:**
1. **Dashboard** — hiển thị dữ liệu thật về Việt Nam (≥ 7 biến độc lập, ≥ 2000 dòng) với các chart tương tác, cross-filter, story-telling.
2. **AI Module** — người dùng yêu cầu phân tích bằng natural language → AI sinh code Python + giải thích → người dùng review/edit/approve → backend chạy code local → trả kết quả về frontend.

**Đối tượng:** Đồ án cuối kỳ môn Trực quan hóa dữ liệu (ĐHKHTN HCM).

---

## 2. Core Principles (BẮT BUỘC tuân thủ)

Đây là các nguyên tắc không thể vi phạm — bất kỳ code nào bạn (Claude Code) viết phải tôn trọng:

### 2.1 Human-in-the-loop
- AI **CHỈ** đề xuất ý tưởng, sinh code, giải thích kết quả.
- AI **KHÔNG** được tự thực thi code, **KHÔNG** tự sửa dữ liệu gốc.
- Mọi đoạn code AI sinh ra đều ở trạng thái `pending` cho đến khi user nhấn nút **Approve**.
- User có quyền **edit** code trước khi approve.

### 2.2 No Silent Execution
- Code phải được **hiển thị rõ ràng** trên UI trước khi chạy.
- Mỗi code block phải kèm **comment giải thích bằng tiếng Việt** (do AI tự sinh, ví dụ: `# Đoạn code này lọc 15 dòng có giá trị NULL ở cột Doanh Thu`).
- Trạng thái code: `pending → edited → approved → executed → completed/failed`.

### 2.3 Local Execution Only
- Code phân tích chạy ở **backend local của user**, KHÔNG gọi sandbox cloud.
- Backend dùng `subprocess` với `timeout` và thư mục cách ly để chạy code.

### 2.4 Full Audit Trail
- Mọi request, code, kết quả, explanation phải được **log đầy đủ vào SQLite** để truy xuất lại.

### 2.5 No Hallucinated Data
- AI tuyệt đối không bịa số liệu/biểu đồ. Chỉ dùng cột có trong schema được cung cấp ở context.
- System prompt cho LLM phải nhấn mạnh điều này.

---

## 3. Tech Stack (đã chốt)

| Layer | Technology | Lý do |
|---|---|---|
| **Backend** | FastAPI + Python 3.11 | Phù hợp với code phân tích Python; async tốt |
| **Frontend** | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui | Đẹp, tương tác tốt, áp được design system từ getdesign.md |
| **Charts** | Recharts (chính) + Plotly (cho chart phức tạp) | Recharts hợp với React, Plotly mạnh cho geo/3D |
| **Code editor** | Monaco Editor (`@monaco-editor/react`) | Editor của VS Code, có syntax highlight |
| **Code execution** | `subprocess` + `matplotlib` (Agg backend) → ảnh PNG base64 | Đơn giản, an toàn đủ dùng |
| **LLM** | Gemini API (default) — abstract qua interface để swap sang OpenAI / Ollama | Free tier rộng |
| **Storage** | SQLite (logs) + filesystem (data CSV/Parquet) | Không cần DB phức tạp |
| **Package manager** | `uv` (Python), `pnpm` (Node) | Nhanh, modern |

---

## 4. Project Structure

```
vn-dataviz-ai/
├── README.md
├── INIT.md                        # File này
├── .gitignore
├── .env.example
├── docker-compose.yml             # Optional, cho deploy local
│
├── backend/
│   ├── pyproject.toml             # uv project
│   ├── .python-version
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI entry
│   │   ├── config.py              # Settings (pydantic-settings)
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── ai.py              # POST /api/ai/generate
│   │   │   ├── execute.py         # POST /api/execute
│   │   │   ├── logs.py            # GET/POST /api/logs
│   │   │   └── data.py            # GET /api/data/schema, /api/data/preview
│   │   ├── services/
│   │   │   ├── llm/
│   │   │   │   ├── base.py        # Abstract LLM client
│   │   │   │   ├── gemini.py      # Gemini implementation
│   │   │   │   └── prompts.py     # System prompts (tiếng Việt)
│   │   │   ├── executor.py        # Sandbox subprocess runner
│   │   │   └── logger.py          # SQLite logger
│   │   ├── models/                # Pydantic schemas
│   │   │   ├── request.py
│   │   │   └── response.py
│   │   └── db/
│   │       └── schema.sql         # SQLite schema for logs
│   ├── data/                      # Dataset CSV/Parquet (gitignored except sample)
│   │   └── sample.csv
│   ├── sandbox/                   # Thư mục chạy code đã approved
│   └── tests/
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── components.json            # shadcn/ui config
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Dashboard chính
│   │   ├── ai/
│   │   │   └── page.tsx           # AI workspace (chat + code editor)
│   │   └── logs/
│   │       └── page.tsx           # Lịch sử yêu cầu
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── charts/                # Wrapper cho Recharts/Plotly
│   │   ├── ai/
│   │   │   ├── ChatInput.tsx
│   │   │   ├── CodeBlock.tsx      # Monaco editor + Approve/Reject
│   │   │   ├── ResultPanel.tsx
│   │   │   └── StatusBadge.tsx    # pending/approved/executed
│   │   └── dashboard/
│   ├── lib/
│   │   ├── api.ts                 # Fetch wrapper
│   │   └── utils.ts
│   └── styles/
│
└── docs/
    ├── architecture.md
    ├── api-spec.md                # OpenAPI summary
    └── design-system.md           # Tham chiếu Cohere/Sentry/Supabase
```

---

## 5. API Contract

### 5.1 `POST /api/ai/generate`

**Mục đích:** AI sinh code + explanation từ yêu cầu user.

**Request:**
```json
{
  "prompt": "Vẽ biểu đồ phân bố giá nhà theo quận ở TP.HCM",
  "data_context": {
    "filename": "vn_realestate.csv",
    "columns": ["price", "district", "area", "..."],
    "dtypes": {"price": "float", "district": "string", "..."},
    "sample_rows": [{"price": 5000, "district": "Quận 1"}]
  },
  "history": []
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "code": "# Đoạn code này...\nimport pandas as pd\n...",
  "explanation": "Code này đọc file CSV, group theo quận và vẽ boxplot...",
  "status": "pending"
}
```

### 5.2 `POST /api/execute`

**Mục đích:** Chạy code đã được user approve.

**Request:**
```json
{
  "request_id": "uuid",
  "code": "...",  // có thể đã được user edit
  "approved_by": "user"
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "status": "completed",
  "stdout": "...",
  "stderr": "",
  "figures": ["data:image/png;base64,..."],
  "tables": [{"columns": [...], "rows": [...]}],
  "execution_time_ms": 1234
}
```

### 5.3 `GET /api/logs` và `GET /api/logs/{id}`

Trả lịch sử request/code/result.

### 5.4 `GET /api/data/schema`

Trả schema dataset để frontend hiển thị + gửi vào context AI.

---

## 6. SQLite Logs Schema

```sql
CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_prompt TEXT NOT NULL,
  data_context_json TEXT,
  ai_code TEXT,
  ai_explanation TEXT,
  edited_code TEXT,
  status TEXT CHECK(status IN ('pending','edited','approved','executed','completed','failed','rejected')),
  execution_result_json TEXT,
  error_message TEXT,
  execution_time_ms INTEGER
);

CREATE INDEX idx_requests_created ON requests(created_at DESC);
CREATE INDEX idx_requests_status  ON requests(status);
```

---

## 7. LLM System Prompt (draft)

Đặt trong `backend/app/services/llm/prompts.py`:

```
Bạn là trợ lý phân tích dữ liệu. Nhiệm vụ:
1. Sinh code Python (pandas, matplotlib, seaborn) để phân tích dataset user cung cấp.
2. CHỈ dùng các cột có trong schema được đưa. KHÔNG bịa cột, KHÔNG bịa số liệu.
3. Mỗi đoạn code phải có comment tiếng Việt giải thích từng bước.
4. Lưu biểu đồ ra file PNG (matplotlib `plt.savefig`), KHÔNG dùng `plt.show()`.
5. Nếu cần bảng kết quả, in ra dạng dataframe (`print(df.head())`).
6. KHÔNG đọc/ghi file ngoài thư mục `./` (sandbox hiện tại).
7. KHÔNG gọi network, KHÔNG `os.system`, KHÔNG `subprocess`.

Trả về JSON: {"code": "...", "explanation": "..."}
```

---

## 8. Design System

Tham khảo từ [getdesign.md](https://getdesign.md/) — kết hợp 3 nguồn:

- **Cohere** (data-rich gradient dashboard) → màu primary, hero card style cho dashboard chính
- **Sentry** (dark, data-dense) → layout panel cho logs page
- **Supabase** (dark emerald, code-first) → code block component, status badges

**Color tokens (Tailwind config):**
- Primary: emerald (Supabase) hoặc violet (Sentry) — chọn 1
- Background: `slate-950` / `zinc-50` (dark/light mode)
- Accent: gradient (Cohere style) cho hero/highlight

Lưu chi tiết tokens vào `docs/design-system.md` sau khi đọc [DESIGN.md](DESIGN.md) đã có trong project.

---

## 9. Init Tasks (Claude Code thực hiện theo thứ tự)

> ✅ Đánh dấu khi hoàn thành. Không skip step.

1. **Tạo cấu trúc thư mục** theo §4. Tạo file rỗng/placeholder cho mọi file được liệt kê.
2. **Init git repo:** `git init`, tạo `.gitignore` (Python + Node + `.env` + `data/*` trừ `data/sample.csv` + `sandbox/*` + `*.db`).
3. **Backend setup:**
   - `cd backend && uv init` → cài `fastapi`, `uvicorn[standard]`, `pydantic-settings`, `python-dotenv`, `pandas`, `matplotlib`, `seaborn`, `google-generativeai`, `aiosqlite`.
   - Viết `app/main.py` với health check `GET /health`.
   - Viết `app/config.py` đọc env (`GEMINI_API_KEY`, `SANDBOX_DIR`, `DB_PATH`).
   - Tạo SQLite schema từ §6, hàm init DB.
4. **Frontend setup:**
   - `cd frontend && pnpm create next-app@latest .` (TypeScript, Tailwind, App Router, src dir = no, alias = `@/*`).
   - `pnpm dlx shadcn@latest init` (style: default, base color: slate hoặc zinc).
   - Cài thêm: `recharts`, `plotly.js-dist-min`, `react-plotly.js`, `@monaco-editor/react`, `lucide-react`, `sonner` (toast).
   - Setup shadcn components cơ bản: `button`, `card`, `input`, `textarea`, `badge`, `tabs`, `dialog`, `scroll-area`, `separator`.
5. **API stubs:** tạo 4 router (ai, execute, logs, data) với endpoint trả mock data đúng schema §5. Mount vào `main.py`.
6. **Frontend pages:** tạo 3 page rỗng (`/`, `/ai`, `/logs`) với layout sidebar + main, dùng shadcn components.
7. **`.env.example`:**
   ```
   GEMINI_API_KEY=
   SANDBOX_DIR=./sandbox
   DB_PATH=./logs.db
   FRONTEND_URL=http://localhost:3000
   ```
8. **README.md:** viết hướng dẫn chạy: `cd backend && uv run uvicorn app.main:app --reload` và `cd frontend && pnpm dev`. Kèm sơ đồ kiến trúc đơn giản.
9. **Commit lần đầu:** `git add . && git commit -m "chore: initial scaffold"`.
10. **Báo cáo lại:** liệt kê những gì đã tạo, file nào còn TODO, lệnh chạy kiểm thử.

---

## 10. Out of Scope (KHÔNG làm ở giai đoạn init)

- ❌ Chưa cần implement LLM thực sự — chỉ cần stub trả mock.
- ❌ Chưa cần dataset thật — chỉ cần `data/sample.csv` 10 dòng giả.
- ❌ Chưa cần auth/user management.
- ❌ Chưa cần deploy/Docker production-ready.
- ❌ Chưa làm UI animation/polish — chỉ cần layout chạy được.

Các phần này sẽ làm ở các milestone sau.

---

## 11. Definition of Done (cho giai đoạn init)

- [ ] `cd backend && uv run uvicorn app.main:app --reload` chạy được, `GET /health` trả `{"ok": true}`.
- [ ] `cd frontend && pnpm dev` chạy được, mở `http://localhost:3000` thấy 3 page đều render.
- [ ] Frontend gọi được tới `GET /api/data/schema` (mock) và hiển thị schema.
- [ ] SQLite file được tạo tự động khi backend khởi động.
- [ ] `git log` có ít nhất 1 commit.
- [ ] README có hướng dẫn chạy đầy đủ.

---

**Khi hoàn thành init, hãy commit và in ra cây thư mục cuối cùng + lệnh để mình verify.**
