"""
backend/app/services/gallery.py
Async CRUD operations for the saved_charts table.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import aiosqlite

from app.config import settings


async def save_chart(
    title: str,
    figure_base64: str,
    prompt: str,
    request_id: str | None = None,
) -> dict[str, Any]:
    chart_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO saved_charts (id, title, figure_base64, prompt, created_at, request_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (chart_id, title, figure_base64, prompt, created_at, request_id),
        )
        await db.commit()

    return {"id": chart_id, "created_at": created_at}


async def list_charts() -> list[dict[str, Any]]:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """
            SELECT id, title, figure_base64, prompt, created_at, request_id
            FROM saved_charts
            ORDER BY created_at DESC
            """
        ) as cursor:
            rows = await cursor.fetchall()

    return [dict(row) for row in rows]


async def delete_chart(chart_id: str) -> bool:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM saved_charts WHERE id = ?",
            (chart_id,),
        )
        await db.commit()
        return cursor.rowcount > 0
