from typing import Literal

from fastapi import APIRouter, Query

from app.services import data_store

router = APIRouter()


def _split_csv(s: str | None) -> list[str] | None:
    if not s:
        return None
    parts = [p.strip() for p in s.split(",") if p.strip()]
    return parts or None


@router.get("/schema")
async def get_schema() -> dict:
    return data_store.get_full_schema()


@router.get("/overview")
async def get_overview(category: str | None = None) -> dict:
    return data_store.get_overview(category)


@router.get("/short-form")
async def get_short_form(
    year_from: int | None = None, category: str | None = None
) -> dict:
    return data_store.get_short_form(year_from, category)


@router.get("/channels")
async def get_channels(
    category: str | None = None, tier: str | None = None
) -> dict:
    return data_store.get_channels_data(category, tier)


@router.get("/anomaly")
async def get_anomaly(
    channel_id: str | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
) -> dict:
    return data_store.get_anomaly(channel_id, year_from, year_to)


@router.get("/interaction")
async def get_interaction(
    categories: str | None = None, duration_group: str | None = None
) -> dict:
    return data_store.get_interaction(_split_csv(categories), duration_group)


@router.get("/economy")
async def get_economy(
    year_from: str | None = "2024-01", categories: str | None = None
) -> dict:
    return data_store.get_economy(year_from, _split_csv(categories))


@router.get("/preview")
async def get_preview(
    source: Literal["videos", "channels"] = Query(...),
    limit: int = Query(20, ge=1, le=100),
) -> dict:
    df = data_store.get_videos() if source == "videos" else data_store.get_channels()
    cols = [c for c in df.columns if not c.startswith("_")]
    head = df[cols].head(limit).where(df[cols].notna(), None)
    rows = head.to_dict(orient="records")
    return {"rows": rows}
