"""
backend/app/api/data.py
Hanoi Air Quality (PM2.5) Dashboard — Data endpoints
Provides aggregated data for 6 dashboard pages + schema/preview
"""
from fastapi import APIRouter

from app.services import data_store

router = APIRouter()


@router.get("/schema")
async def get_schema() -> dict:
    """
    GET /api/data/schema
    Return dataset schema for LLM context injection
    """
    return data_store.get_schema()


@router.get("/preview")
async def get_preview(limit: int = 50) -> dict:
    """
    GET /api/data/preview?limit=50
    Return sample rows from dataset
    """
    return data_store.get_preview(limit)


# ─────────────────────────────────────────────────────────────────────────────
# Page Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/overview")
async def get_overview() -> dict:
    """
    GET /api/data/overview
    RO1: Overview page (A1, A2, A3)
    - A1: AQI distribution (donut chart)
    - A2: PM2.5 monthly timeline (line chart)
    - A3: PM2.5 by season (bar chart)
    """
    return data_store.get_overview()


@router.get("/seasonal")
async def get_seasonal_trends(season: str | None = None) -> dict:
    """
    GET /api/data/seasonal?season=Spring
    RO2: Seasonal analysis (B1, B2, B3)
    - B1: PM2.5 by weather type (box plot)
    - B2: Humidity vs PM2.5 (scatter)
    - B3: Pressure vs PM2.5 (scatter)
    """
    return data_store.get_seasonal_trends(season)


@router.get("/hourly")
async def get_hourly_patterns(date_from: str | None = None, date_to: str | None = None) -> dict:
    """
    GET /api/data/hourly?date_from=2024-01-01&date_to=2024-12-31
    RO3: Hourly analysis (C1, C2, C3)
    - C1: PM2.5 by hour (polar chart, 24-hour radial)
    - C2: PM2.5 × Temperature heatmap
    - C3: AQI % distribution by hour (stacked bar)
    """
    return data_store.get_hourly_patterns(date_from, date_to)


@router.get("/weather")
async def get_weather_impact() -> dict:
    """
    GET /api/data/weather
    RO4: Weather impact (D1, D2, D3)
    - D1: Weather correlation coefficients (bar)
    - D2: Seasonal weather scatter
    - D3: PM2.5 + temperature dual-axis
    """
    return data_store.get_weather_impact()


@router.get("/trend")
async def get_trend_yoy(year_from: int | None = None, year_to: int | None = None) -> dict:
    """
    GET /api/data/trend?year_from=2024&year_to=2026
    RO5: Trend analysis (E1, E2, E3)
    - E1: Year-over-year trend (2024 vs 2025 vs 2026)
    - E2: Monthly anomaly heatmap
    - E3: Rolling average (7-day, 30-day)
    """
    return data_store.get_trend_yoy(year_from, year_to)


@router.get("/weekend")
async def get_weekday_weekend() -> dict:
    """
    GET /api/data/weekend
    RO6: Weekend vs Weekday (F1, F2, F3)
    - F1: Box plot (PM2.5 distribution)
    - F2: Grouped bar (PM2.5 by day-type × hour)
    - F3: Line comparison (24-hour profiles)
    """
    return data_store.get_weekday_weekend()
