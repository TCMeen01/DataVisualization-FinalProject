import json
from pathlib import Path
from typing import Any

import aiosqlite

from app.config import settings

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "db" / "schema.sql"


async def init_db() -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.executescript(schema_sql)
        async with db.execute("PRAGMA table_info(requests)") as cur:
            cols = {row[1] async for row in cur}
        if "was_edited" not in cols:
            await db.execute(
                "ALTER TABLE requests ADD COLUMN was_edited BOOLEAN DEFAULT 0"
            )
            await db.commit()
        async with db.execute(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='requests'"
        ) as cur:
            row = await cur.fetchone()
        existing_sql = row[0] if row else ""
        if "'executing'" not in existing_sql:
            await db.executescript(
                """
                BEGIN;
                ALTER TABLE requests RENAME TO requests__legacy;
                CREATE TABLE requests (
                  id TEXT PRIMARY KEY,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  user_prompt TEXT NOT NULL,
                  data_context_json TEXT,
                  ai_code TEXT,
                  ai_explanation TEXT,
                  edited_code TEXT,
                  was_edited BOOLEAN DEFAULT 0,
                  status TEXT CHECK(status IN ('pending','edited','approved','executing','executed','completed','failed','rejected')),
                  execution_result_json TEXT,
                  error_message TEXT,
                  execution_time_ms INTEGER
                );
                INSERT INTO requests (
                    id, created_at, user_prompt, data_context_json, ai_code, ai_explanation,
                    edited_code, was_edited, status, execution_result_json, error_message, execution_time_ms
                )
                SELECT
                    id, created_at, user_prompt, data_context_json, ai_code, ai_explanation,
                    edited_code, COALESCE(was_edited, 0), status, execution_result_json, error_message, execution_time_ms
                FROM requests__legacy;
                DROP TABLE requests__legacy;
                CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
                COMMIT;
                """
            )
        await db.commit()


async def insert_request(
    request_id: str,
    user_prompt: str,
    data_context: dict | None,
    ai_code: str,
    ai_explanation: str,
) -> None:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO requests
                (id, user_prompt, data_context_json, ai_code, ai_explanation, status, was_edited)
            VALUES (?, ?, ?, ?, ?, 'pending', 0)
            """,
            (
                request_id,
                user_prompt,
                json.dumps(data_context) if data_context else None,
                ai_code,
                ai_explanation,
            ),
        )
        await db.commit()


async def update_request_edit(
    request_id: str, edited_code: str, was_edited: bool
) -> None:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            "UPDATE requests SET edited_code = ?, was_edited = ?, status = 'edited' WHERE id = ?",
            (edited_code, 1 if was_edited else 0, request_id),
        )
        await db.commit()


async def update_request_status(request_id: str, status: str) -> None:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            "UPDATE requests SET status = ? WHERE id = ?",
            (status, request_id),
        )
        await db.commit()


async def update_request_execution(request_id: str, result: dict[str, Any]) -> None:
    blob = json.dumps(result, ensure_ascii=False)
    status = result.get("status", "completed")
    exec_ms = result.get("execution_time_ms")
    err = result.get("error_message")
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            """
            UPDATE requests
            SET execution_result_json = ?,
                status = ?,
                execution_time_ms = ?,
                error_message = ?
            WHERE id = ?
            """,
            (blob, status, exec_ms, err, request_id),
        )
        await db.commit()


async def get_request(request_id: str) -> dict | None:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM requests WHERE id = ?", (request_id,)
        ) as cur:
            row = await cur.fetchone()
    if row is None:
        return None
    d = dict(row)
    if d.get("execution_result_json"):
        try:
            d["execution_result"] = json.loads(d["execution_result_json"])
        except json.JSONDecodeError:
            d["execution_result"] = None
    else:
        d["execution_result"] = None
    if d.get("data_context_json"):
        try:
            d["data_context"] = json.loads(d["data_context_json"])
        except json.JSONDecodeError:
            d["data_context"] = None
    else:
        d["data_context"] = None
    d["was_edited"] = bool(d.get("was_edited") or 0)
    return d


async def list_requests(
    status: str | None = None, limit: int = 20, offset: int = 0
) -> dict[str, Any]:
    where = "WHERE status = ?" if status else ""
    params_total: tuple = (status,) if status else ()
    params_items: tuple = (
        (status, limit, offset) if status else (limit, offset)
    )
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            f"SELECT COUNT(*) AS n FROM requests {where}", params_total
        ) as cur:
            total_row = await cur.fetchone()
        total = int(total_row["n"]) if total_row else 0
        async with db.execute(
            f"""
            SELECT id, created_at, user_prompt, status, execution_time_ms, was_edited
            FROM requests
            {where}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            params_items,
        ) as cur:
            rows = await cur.fetchall()
    items = []
    for r in rows:
        d = dict(r)
        d["was_edited"] = bool(d.get("was_edited") or 0)
        items.append(d)
    return {"total": total, "items": items}
