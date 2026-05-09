"""
backend/app/services/data_store.py
Hanoi Air Quality (PM2.5) Analytics — DataStore singleton
Dataset: hanoi_aqi_ml_ready_fixed.csv (2024-2026 hourly)
Columns (gốc lowercase): datetime, pm25, temperature, humidity, pressure_msl,
                          wind_speed, precipitation, season, is_weekend, ...
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
AQI_CSV = DATA_DIR / "hanoi_aqi_ml_ready_fixed.csv"

_data: pd.DataFrame | None = None


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _get_season(month: int) -> str:
    if month in [2, 3, 4]:  return "Spring"
    if month in [5, 6, 7]:  return "Summer"
    if month in [8, 9, 10]: return "Autumn"
    return "Winter"


def _get_aqi_category(pm25: float) -> str | None:
    if pd.isna(pm25):      return None
    if pm25 < 12:          return "Good"
    if pm25 < 35.4:        return "Moderate"
    if pm25 < 55.4:        return "Unhealthy_Sensitive"
    if pm25 < 150.4:       return "Unhealthy"
    if pm25 < 250.4:       return "Very_Unhealthy"
    return "Hazardous"


# ──────────────────────────────────────────────────────────────────────────────
# Load
# ──────────────────────────────────────────────────────────────────────────────

def load() -> None:
    """Load Hanoi AQI dataset. Tên cột CSV đã lowercase — không cần rename."""
    global _data
    if not AQI_CSV.exists():
        raise RuntimeError(
            f"Thiếu file dữ liệu: {AQI_CSV}. "
            "Đặt hanoi_aqi_ml_ready_fixed.csv vào backend/data/."
        )

    _data = pd.read_csv(AQI_CSV)

    # Parse datetime
    _data["datetime"] = pd.to_datetime(_data["datetime"], errors="coerce", utc=True)

    # Ghi đè các cột thời gian từ datetime (phòng trường hợp CSV bị lệch)
    _data["Year"]      = _data["datetime"].dt.year
    _data["Month"]     = _data["datetime"].dt.month
    _data["Day"]       = _data["datetime"].dt.day
    _data["Hour"]      = _data["datetime"].dt.hour
    _data["DayOfWeek"] = _data["datetime"].dt.dayofweek   # 0=Mon, 6=Sun
    _data["Date"]      = _data["datetime"].dt.date

    # Season — dùng cột month gốc (lowercase)
    _data["Season"] = _data["month"].apply(_get_season)

    # DayType từ is_weekend (bool) đã có sẵn trong CSV
    if "is_weekend" in _data.columns:
        _data["DayType"] = _data["is_weekend"].apply(
            lambda x: "Weekend" if x else "Weekday"
        )
    else:
        _data["DayType"] = _data["DayOfWeek"].apply(
            lambda x: "Weekend" if x >= 5 else "Weekday"
        )

    # AQI_Category tính từ pm25
    _data["AQI_Category"] = _data["pm25"].apply(_get_aqi_category)


def _require_loaded() -> pd.DataFrame:
    if _data is None:
        raise RuntimeError("Data store chưa load. Gọi load() ở lifespan trước.")
    return _data


def get_data() -> pd.DataFrame:
    return _require_loaded().copy()


# ──────────────────────────────────────────────────────────────────────────────
# A: Overview (A1, A2, A3)
# ──────────────────────────────────────────────────────────────────────────────

def get_overview() -> dict[str, Any]:
    """
    Overview page data (A1–A3):
    - KPIs: avg/max/min pm25, total records, % giờ vượt WHO
    - A1: AQI distribution (donut)
    - A2: PM2.5 monthly timeline
    - A3: PM2.5 by season
    """
    df = _require_loaded()

    # KPIs
    pm25_all = df["pm25"].dropna()
    avg_pm25  = float(pm25_all.mean()) if len(pm25_all) > 0 else 0.0
    max_pm25  = float(pm25_all.max())  if len(pm25_all) > 0 else 0.0
    min_pm25  = float(pm25_all.min())  if len(pm25_all) > 0 else 0.0
    pct_above_who = float((pm25_all > 15).mean() * 100) if len(pm25_all) > 0 else 0.0

    # A1: AQI Distribution
    a1_counts = df["AQI_Category"].value_counts().to_dict()
    a1 = [
        {"name": cat, "value": int(count)}
        for cat, count in a1_counts.items()
    ]

    # A2: PM2.5 monthly average
    a2_data = (
        df.groupby(df["datetime"].dt.to_period("M"))["pm25"]
        .agg(["mean", "std"])
        .reset_index()
    )
    a2_data["datetime"] = a2_data["datetime"].astype(str)
    a2 = [
        {
            "month": row["datetime"],
            "pm25":  float(row["mean"]),
            "std":   float(row["std"]) if not pd.isna(row["std"]) else 0.0,
        }
        for _, row in a2_data.iterrows()
    ]

    # A3: PM2.5 by season
    a3_data = df.groupby("Season")["pm25"].mean().reset_index()
    a3 = [
        {"season": row["Season"], "pm25": float(row["pm25"])}
        for _, row in a3_data.iterrows()
    ]

    return {
        "kpis": {
            "avg_pm25":       avg_pm25,
            "max_pm25":       max_pm25,
            "min_pm25":       min_pm25,
            "total_records":  int(len(df)),
            "pct_above_who":  pct_above_who,
        },
        "a1_aqi_distribution": a1,
        "a2_pm25_timeline":    a2,
        "a3_pm25_by_season":   a3,
    }


# ──────────────────────────────────────────────────────────────────────────────
# B: Seasonal Trends (B1, B2, B3)
# ──────────────────────────────────────────────────────────────────────────────

def get_seasonal_trends(season: str | None = None) -> dict[str, Any]:
    """
    Seasonal analysis (B1–B3):
    - B1: Box plot PM2.5 theo mùa
    - B2: Scatter PM2.5 vs Humidity (counter-intuitive: r ≈ 0)
    - B3: Scatter PM2.5 vs Temperature (tương quan âm rõ)
    """
    df = _require_loaded()

    if season:
        df = df[df["Season"] == season]

    # B1: Box plot PM2.5 by season
    b1_box = []
    for s, sub in df.groupby("Season"):
        values = sub["pm25"].dropna().tolist()
        if values:
            b1_box.append({"season": s, "values": values})

    # B2: Humidity vs PM2.5 scatter
    b2_data = df[["humidity", "pm25", "AQI_Category", "Season"]].dropna()
    b2_scatter = [
        {
            "humidity":     float(row["humidity"]),
            "pm25":         float(row["pm25"]),
            "aqi_category": row["AQI_Category"],
            "season":       row["Season"],
        }
        for _, row in b2_data.iterrows()
    ]

    # Correlation humidity–pm25 (counter-intuitive insight)
    corr_humidity = float(df["pm25"].corr(df["humidity"])) if "humidity" in df else 0.0

    # B3: Temperature vs PM2.5 scatter
    b3_data = df[["temperature", "pm25", "AQI_Category", "Season"]].dropna()
    b3_scatter = [
        {
            "temperature":  float(row["temperature"]),
            "pm25":         float(row["pm25"]),
            "aqi_category": row["AQI_Category"],
            "season":       row["Season"],
        }
        for _, row in b3_data.iterrows()
    ]

    corr_temp = float(df["pm25"].corr(df["temperature"])) if "temperature" in df else 0.0

    return {
        "b1_box":              b1_box,
        "b2_humidity_scatter": b2_scatter,
        "b3_temp_scatter":     b3_scatter,
        "correlations": {
            "humidity":    corr_humidity,
            "temperature": corr_temp,
        },
    }


# ──────────────────────────────────────────────────────────────────────────────
# C: Hourly Patterns (C1, C2, C3)
# ──────────────────────────────────────────────────────────────────────────────

def get_hourly_patterns(
    date_from: str | None = None,
    date_to:   str | None = None,
) -> dict[str, Any]:
    """
    Hourly analysis (C1–C3):
    - C1: PM2.5 by hour — polar/radial chart
    - C2: Heatmap Hour × Day-of-week
    - C3: AQI % distribution by time slot (stacked bar)
    """
    df = _require_loaded()

    if date_from:
        df = df[df["Date"] >= pd.to_datetime(date_from).date()]
    if date_to:
        df = df[df["Date"] <= pd.to_datetime(date_to).date()]

    # C1: PM2.5 by hour (polar)
    c1_hourly = df.groupby("Hour")["pm25"].mean().reset_index()
    c1 = [
        {"hour": int(row["Hour"]), "pm25": float(row["pm25"])}
        for _, row in c1_hourly.iterrows()
    ]

    # C2: Heatmap Hour × DayOfWeek
    heatmap_pivot = df.pivot_table(
        index="DayOfWeek",
        columns="Hour",
        values="pm25",
        aggfunc="mean",
    )
    # Thay index số 0–6 thành tên ngày
    day_names = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"]
    heatmap_pivot.index = [day_names[i] for i in heatmap_pivot.index]

    c2_heatmap = {
        "days":  heatmap_pivot.index.tolist(),
        "hours": [int(h) for h in heatmap_pivot.columns.tolist()],
        "z":     [
            [None if (isinstance(v, float) and np.isnan(v)) else float(v) for v in row]
            for row in heatmap_pivot.values.tolist()
        ],
    }

    # C3: Stacked bar — AQI % by hour
    c3_stacked = []
    for hour in range(24):
        hour_data = df[df["Hour"] == hour]
        total = len(hour_data)
        if total > 0:
            aqi_counts = hour_data["AQI_Category"].value_counts()
            c3_stacked.append({
                "hour":                  int(hour),
                "Good":                  int(aqi_counts.get("Good", 0)),
                "Moderate":              int(aqi_counts.get("Moderate", 0)),
                "Unhealthy_Sensitive":   int(aqi_counts.get("Unhealthy_Sensitive", 0)),
                "Unhealthy":             int(aqi_counts.get("Unhealthy", 0)),
                "Very_Unhealthy":        int(aqi_counts.get("Very_Unhealthy", 0)),
                "Hazardous":             int(aqi_counts.get("Hazardous", 0)),
                "total":                 int(total),
            })

    return {
        "c1_hourly_polar": c1,
        "c2_heatmap":      c2_heatmap,
        "c3_aqi_stacked":  c3_stacked,
    }


# ──────────────────────────────────────────────────────────────────────────────
# D: Weather Impact (D1, D2, D3)
# ──────────────────────────────────────────────────────────────────────────────

def get_weather_impact(season: str | None = None) -> dict[str, Any]:
    """
    Weather impact analysis (D1–D3) — RO3:
    - D1: Correlation bar chart (tất cả biến thời tiết vs pm25)
    - D2: Scatter PM2.5 vs Tốc độ gió theo mùa
    - D3: Dual-axis PM2.5 + Tốc độ gió theo ngày
    """
    df = _require_loaded()

    # Apply season filter if provided
    if season:
        seasons = [s.strip() for s in season.split(",")]
        df = df[df["Season"].isin(seasons)]

    # D1: Pearson correlation — tất cả biến thời tiết với pm25
    weather_vars = ["temperature", "humidity", "pressure_msl", "wind_speed", "precipitation"]
    # Vietnamese labels for frontend display
    var_labels = {
        "temperature":   "Nhiệt độ (°C)",
        "humidity":      "Độ ẩm (%)",
        "pressure_msl":  "Áp suất (hPa)",
        "wind_speed":    "Tốc độ gió (m/s)",
        "precipitation": "Lượng mưa (mm)",
    }
    d1_corr = []
    for col in weather_vars:
        if col in df.columns:
            corr = df["pm25"].corr(df[col])
            r_val = float(corr) if not pd.isna(corr) else 0.0
            # Annotation text for notable correlations
            annotation = ""
            if col == "humidity":
                annotation = "r ≈ 0 — Độ ẩm gần như KHÔNG ảnh hưởng!"
            elif col == "wind_speed":
                annotation = "r < 0 — Gió mạnh giảm ô nhiễm đáng kể"
            elif col == "pressure_msl":
                annotation = "Áp suất cao → không khí tĩnh → ô nhiễm tích tụ"

            d1_corr.append({
                "variable":    col,
                "label":       var_labels.get(col, col),
                "correlation": r_val,
                "annotation":  annotation,
            })
    # Sắp xếp theo |r| giảm dần
    d1_corr.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    # Wind speed correlation value (for insight)
    wind_corr = float(df["pm25"].corr(df["wind_speed"])) if "wind_speed" in df.columns else 0.0
    humidity_corr = float(df["pm25"].corr(df["humidity"])) if "humidity" in df.columns else 0.0

    # D2: Scatter PM2.5 vs Wind Speed theo mùa (sampled for performance)
    d2_cols = ["Season", "wind_speed", "pm25"]
    d2_data = df[d2_cols].dropna()
    # Sample to max 2000 points for frontend performance
    if len(d2_data) > 2000:
        d2_data = d2_data.sample(n=2000, random_state=42)
    d2_scatter = [
        {
            "season":     row["Season"],
            "wind_speed": float(row["wind_speed"]),
            "pm25":       float(row["pm25"]),
        }
        for _, row in d2_data.iterrows()
    ]

    # Per-season correlation for D2 annotation
    season_corr = {}
    for s, sub in df.groupby("Season"):
        if "wind_speed" in sub.columns and len(sub) > 10:
            r = sub["pm25"].corr(sub["wind_speed"])
            season_corr[s] = float(r) if not pd.isna(r) else 0.0

    # D3: Daily dual-axis PM2.5 + Wind Speed (REQUIREMENTS: "X: ngày (daily average)")
    d3_daily = (
        df.groupby("Date")
        .agg({"pm25": "mean", "wind_speed": "mean"})
        .reset_index()
    )
    d3_daily = d3_daily.sort_values("Date")
    d3_dual = [
        {
            "date":       str(row["Date"]),
            "pm25":       float(row["pm25"]),
            "wind_speed": float(row["wind_speed"]),
        }
        for _, row in d3_daily.iterrows()
    ]

    return {
        "d1_correlation":    d1_corr,
        "d2_wind_scatter":   d2_scatter,
        "d2_season_corr":    season_corr,
        "d3_dual_axis":      d3_dual,
        "insight": {
            "wind_corr":     wind_corr,
            "humidity_corr": humidity_corr,
        },
    }


# ──────────────────────────────────────────────────────────────────────────────
# E: Trend Analysis (E1, E2, E3)
# ──────────────────────────────────────────────────────────────────────────────

def get_trend_yoy(
    year_from: int | None = None,
    year_to:   int | None = None,
) -> dict[str, Any]:
    """
    Year-over-year analysis (E1–E3):
    - E1: YoY line (2024 vs 2025 vs 2026, trục X = tháng 1–12)
    - E2: Heatmap Year × Month
    - E3: Rolling average (daily raw + 7-day + 30-day)
    """
    df = _require_loaded()

    if year_from:
        df = df[df["Year"] >= year_from]
    if year_to:
        df = df[df["Year"] <= year_to]

    # E1: YoY — group by year + month (so sánh cùng tháng)
    e1_monthly = (
        df.groupby(["Year", "Month"])["pm25"]
        .mean()
        .reset_index()
    )
    e1_yoy = [
        {
            "year":  int(row["Year"]),
            "month": int(row["Month"]),
            "pm25":  float(row["pm25"]),
        }
        for _, row in e1_monthly.iterrows()
    ]

    # E2: Heatmap Year × Month
    monthly_pivot = df.pivot_table(
        index="Year",
        columns="Month",
        values="pm25",
        aggfunc="mean",
    )
    e2_heatmap = {
        "years":  [int(y) for y in monthly_pivot.index.tolist()],
        "months": [int(m) for m in monthly_pivot.columns.tolist()],
        "z": [
            [None if (isinstance(v, float) and np.isnan(v)) else float(v) for v in row]
            for row in monthly_pivot.values.tolist()
        ],
    }

    # E3: Rolling average (daily)
    # Ưu tiên dùng pm25_rolling_7d / pm25_rolling_7d có sẵn trong CSV
    daily_data = df.groupby("Date")["pm25"].mean().reset_index()

    if "pm25_rolling_7d" in df.columns:
        # Tận dụng feature đã tính sẵn (lấy giá trị cuối ngày)
        rolling_7d_map  = df.groupby("Date")["pm25_rolling_7d"].last().to_dict()
        rolling_24h_map = df.groupby("Date")["pm25_rolling_24h"].last().to_dict() \
                          if "pm25_rolling_24h" in df.columns else {}
        daily_data["rolling_7d"]  = daily_data["Date"].map(rolling_7d_map)
        daily_data["rolling_30d"] = daily_data["pm25"].rolling(window=30).mean()
    else:
        daily_data["rolling_7d"]  = daily_data["pm25"].rolling(window=7).mean()
        daily_data["rolling_30d"] = daily_data["pm25"].rolling(window=30).mean()

    e3_rolling = [
        {
            "date":       str(row["Date"]),
            "pm25":       float(row["pm25"]),
            "rolling_7d": float(row["rolling_7d"])  if not pd.isna(row["rolling_7d"])  else None,
            "rolling_30d":float(row["rolling_30d"]) if not pd.isna(row["rolling_30d"]) else None,
        }
        for _, row in daily_data.iterrows()
    ]

    return {
        "e1_yoy":             e1_yoy,
        "e2_monthly_heatmap": e2_heatmap,
        "e3_rolling_average": e3_rolling,
    }


# ──────────────────────────────────────────────────────────────────────────────
# F: Weekend vs Weekday (F1, F2, F3)
# ──────────────────────────────────────────────────────────────────────────────

def get_weekday_weekend() -> dict[str, Any]:
    """
    Weekend vs Weekday analysis (F1–F3):
    - F1: Box plot PM2.5 by DayType
    - F2: Grouped bar PM2.5 by hour × DayType
    - F3: Line so sánh profile 24h (Weekday vs Weekend)
    """
    df = _require_loaded()

    # F1: Box plot by DayType
    f1_box = []
    for day_type in ["Weekday", "Weekend"]:
        values = df[df["DayType"] == day_type]["pm25"].dropna().tolist()
        if values:
            q1  = float(np.percentile(values, 25))
            q3  = float(np.percentile(values, 75))
            med = float(np.median(values))
            avg = float(np.mean(values))
            f1_box.append({
                "day_type": day_type,
                "values":   values,
                "q1":       q1,
                "median":   med,
                "q3":       q3,
                "mean":     avg,
            })

    # % chênh lệch weekday vs weekend (counter-intuitive insight)
    weekday_mean  = df[df["DayType"] == "Weekday"]["pm25"].mean()
    weekend_mean  = df[df["DayType"] == "Weekend"]["pm25"].mean()
    pct_diff = float(abs(weekday_mean - weekend_mean) / weekday_mean * 100) \
               if weekday_mean > 0 else 0.0

    # F2: Grouped bar PM2.5 by hour × DayType
    f2_grouped = []
    for hour in range(24):
        hour_df  = df[df["Hour"] == hour]
        weekday  = hour_df[hour_df["DayType"] == "Weekday"]["pm25"].mean()
        weekend  = hour_df[hour_df["DayType"] == "Weekend"]["pm25"].mean()
        f2_grouped.append({
            "hour":    int(hour),
            "weekday": float(weekday) if not pd.isna(weekday) else 0.0,
            "weekend": float(weekend) if not pd.isna(weekend) else 0.0,
        })

    # F3: 24h profile comparison
    wday = df[df["DayType"] == "Weekday"].groupby("Hour")["pm25"].mean()
    wend = df[df["DayType"] == "Weekend"].groupby("Hour")["pm25"].mean()
    f3_comparison = [
        {
            "hour":    int(hour),
            "weekday": float(wday.get(hour, 0.0)),
            "weekend": float(wend.get(hour, 0.0)),
        }
        for hour in range(24)
    ]

    return {
        "f1_box":            f1_box,
        "f2_grouped_bar":    f2_grouped,
        "f3_line_comparison":f3_comparison,
        "insight": {
            "weekday_mean":  float(weekday_mean),
            "weekend_mean":  float(weekend_mean),
            "pct_diff":      pct_diff,
        },
    }


# ──────────────────────────────────────────────────────────────────────────────
# Schema & Preview
# ──────────────────────────────────────────────────────────────────────────────

def get_schema() -> dict[str, Any]:
    """Return dataset schema for LLM injection."""
    df = _require_loaded()

    columns_info = []
    for col in df.columns:
        if col.startswith("_"):
            continue
        s     = df[col]
        dtype = str(s.dtype)
        entry: dict[str, Any] = {
            "name":         col,
            "dtype":        dtype,
            "null_count":   int(s.isna().sum()),
            "unique_count": int(s.nunique()),
        }
        if pd.api.types.is_numeric_dtype(s) and not pd.api.types.is_bool_dtype(s):
            non_null = s.dropna()
            if len(non_null) > 0:
                entry["min"]  = float(non_null.min())
                entry["max"]  = float(non_null.max())
                entry["mean"] = float(non_null.mean())
                entry["std"]  = float(non_null.std())
        columns_info.append(entry)

    return {
        "dataset":     "Hanoi Air Quality (PM2.5) 2024-2026",
        "row_count":   int(len(df)),
        "date_range": {
            "start": str(df["datetime"].min()),
            "end":   str(df["datetime"].max()),
        },
        "columns":     columns_info,
        "description": "Dữ liệu PM2.5 và thời tiết theo giờ tại Hà Nội (2024–2026). "
                       "Nguồn: US Embassy monitoring station qua Kaggle.",
    }


def get_preview(limit: int = 50) -> dict[str, Any]:
    """Return sample rows for preview."""
    df = _require_loaded()
    sample = df.head(limit)
    return {
        "columns":    df.columns.tolist(),
        "data":       sample.where(pd.notna(sample), None).to_dict(orient="records"),
        "total_rows": int(len(df)),
    }
