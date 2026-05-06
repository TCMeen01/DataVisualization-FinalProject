import json
from pathlib import Path

import aiosqlite

from app.config import settings

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "db" / "schema.sql"


async def init_db() -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.executescript(schema_sql)
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
                (id, user_prompt, data_context_json, ai_code, ai_explanation, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
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


async def list_requests(limit: int = 50) -> list[dict]:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, created_at, user_prompt, status, execution_time_ms "
            "FROM requests ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ) as cur:
            rows = await cur.fetchall()
    return [dict(r) for r in rows]
