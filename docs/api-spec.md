# API Spec (giai đoạn init: trả mock)

Base URL: `http://localhost:8000`

## `GET /health`

```json
{ "ok": true }
```

## `POST /api/ai/generate`

**Request:**
```json
{
  "prompt": "Vẽ biểu đồ phân bố giá nhà theo quận ở TP.HCM",
  "data_context": {
    "filename": "sample.csv",
    "columns": ["district", "price_million_vnd", "..."],
    "dtypes": {"price_million_vnd": "float64"},
    "sample_rows": []
  },
  "history": []
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "code": "# Đoạn code này...\nimport pandas as pd\n...",
  "explanation": "Code này đọc CSV, group theo quận và vẽ boxplot...",
  "status": "pending"
}
```

## `POST /api/execute`

**Request:**
```json
{
  "request_id": "uuid",
  "code": "...",
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
  "tables": [{"columns": [], "rows": []}],
  "execution_time_ms": 1234
}
```

## `GET /api/logs`

Trả mảng `LogEntry`:
```json
[
  {
    "id": "uuid",
    "created_at": "2026-05-06 14:00:00",
    "user_prompt": "...",
    "status": "completed",
    "execution_time_ms": 1234
  }
]
```

## `GET /api/logs/{id}`

Trả 1 `LogEntry` hoặc 404.

## `GET /api/data/schema?filename=sample.csv`

```json
{
  "filename": "sample.csv",
  "columns": ["district", "price_million_vnd", "..."],
  "dtypes": {"district": "object", "price_million_vnd": "int64"},
  "row_count": 10,
  "sample_rows": [{"district": "Quận 1", "price_million_vnd": 12500}]
}
```

## `GET /api/data/preview?filename=sample.csv&limit=20`

```json
{
  "columns": ["district", "..."],
  "rows": [["Quận 1", 12500, "..."]]
}
```

## Status enum

`pending → edited → approved → executed → completed | failed | rejected`
