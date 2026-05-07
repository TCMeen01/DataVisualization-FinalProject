from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
VIDEOS_CSV = DATA_DIR / "videos_processed.csv"
CHANNELS_CSV = DATA_DIR / "channels_processed.csv"

_videos: pd.DataFrame | None = None
_channels: pd.DataFrame | None = None


def load() -> None:
    global _videos, _channels
    if not VIDEOS_CSV.exists():
        raise RuntimeError(
            f"Thiếu file dữ liệu: {VIDEOS_CSV}. Đặt videos_processed.csv vào backend/data/."
        )
    if not CHANNELS_CSV.exists():
        raise RuntimeError(
            f"Thiếu file dữ liệu: {CHANNELS_CSV}. Đặt channels_processed.csv vào backend/data/."
        )
    _videos = pd.read_csv(VIDEOS_CSV)
    _channels = pd.read_csv(CHANNELS_CSV)
    if "published_at" in _videos.columns:
        _videos["_published_dt"] = pd.to_datetime(
            _videos["published_at"], errors="coerce", utc=True
        )


def _require_loaded() -> tuple[pd.DataFrame, pd.DataFrame]:
    if _videos is None or _channels is None:
        raise RuntimeError("Data store chưa load. Gọi load() ở lifespan trước.")
    return _videos, _channels


def get_videos() -> pd.DataFrame:
    v, _ = _require_loaded()
    return v


def get_channels() -> pd.DataFrame:
    _, c = _require_loaded()
    return c


def _column_meta(df: pd.DataFrame) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for col in df.columns:
        if col.startswith("_"):
            continue
        s = df[col]
        dtype = str(s.dtype)
        entry: dict[str, Any] = {
            "name": col,
            "dtype": dtype,
            "null_count": int(s.isna().sum()),
            "min": None,
            "max": None,
            "mean": None,
        }
        if pd.api.types.is_numeric_dtype(s) and not pd.api.types.is_bool_dtype(s):
            non_null = s.dropna()
            if len(non_null) > 0:
                entry["min"] = float(non_null.min())
                entry["max"] = float(non_null.max())
                entry["mean"] = float(non_null.mean())
        out.append(entry)
    return out


def get_full_schema() -> dict[str, Any]:
    v, c = _require_loaded()
    return {
        "videos": {
            "row_count": int(len(v)),
            "columns": _column_meta(v),
        },
        "channels": {
            "row_count": int(len(c)),
            "columns": _column_meta(c),
        },
    }


def _to_jsonable(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_jsonable(x) for x in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        f = float(obj)
        return f if not (np.isnan(f) or np.isinf(f)) else None
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    return obj


def _records(df: pd.DataFrame) -> list[dict[str, Any]]:
    return _to_jsonable(df.where(pd.notna(df), None).to_dict(orient="records"))


def get_overview(category: str | None = None) -> dict[str, Any]:
    v, c = _require_loaded()
    total_videos = int(len(v))
    total_channels = int(len(c))
    total_views = int(v["view_count"].sum()) if "view_count" in v.columns else 0
    short_ratio = (
        float(v["is_short_form"].mean()) if "is_short_form" in v.columns else 0.0
    )

    a1_src = (
        v.groupby("channel_category", dropna=True)
        .size()
        .reset_index(name="video_count")
        .sort_values("video_count", ascending=False)
    )
    a1 = _records(a1_src)

    filtered = v if not category else v[v["channel_category"] == category]

    a2_src = (
        filtered.groupby("year", dropna=True)["view_count"]
        .sum()
        .reset_index()
        .rename(columns={"view_count": "total_views"})
        .sort_values("year")
    )
    a2 = _records(a2_src)

    a3_rows: list[dict[str, Any]] = []
    if "year" in filtered.columns and "is_short_form" in filtered.columns:
        grouped = filtered.groupby("year", dropna=True)
        for year, sub in grouped:
            total = int(len(sub))
            shorts = int(sub["is_short_form"].sum())
            longs = total - shorts
            a3_rows.append(
                {
                    "year": int(year),
                    "short_count": shorts,
                    "long_count": longs,
                    "short_ratio": (shorts / total) if total else 0.0,
                }
            )
        a3_rows.sort(key=lambda r: r["year"])

    return {
        "kpis": {
            "total_videos": total_videos,
            "total_channels": total_channels,
            "total_views": total_views,
            "short_form_ratio": short_ratio,
        },
        "a1_category_pie": a1,
        "a2_views_by_year": a2,
        "a3_short_long_ratio": a3_rows,
    }


def get_short_form(
    year_from: int | None = None, category: str | None = None
) -> dict[str, Any]:
    v, _ = _require_loaded()
    df = v[v["is_short_form"] == True].copy()  # noqa: E712
    if year_from is not None:
        df = df[df["year"] >= year_from]
    if category:
        df = df[df["channel_category"] == category]

    b1_src = (
        df.groupby(["channel_name", "year"], dropna=True)
        .size()
        .reset_index(name="short_count")
    )
    b1 = _records(b1_src)

    b2_src = (
        df.groupby(["year", "channel_category"], dropna=True)
        .size()
        .reset_index(name="short_count")
        .sort_values(["year", "channel_category"])
    )
    b2 = _records(b2_src)

    return {
        "b1_channel_year_heatmap": b1,
        "b2_category_year_stacked": b2,
        "row_count": int(len(df)),
    }


def get_channels_data(
    category: str | None = None, tier: str | None = None
) -> dict[str, Any]:
    _, c = _require_loaded()
    df = c.copy()
    if category:
        df = df[df["channel_category"] == category]
    if tier:
        df = df[df["subscriber_tier"] == tier]

    c1_rows: list[dict[str, Any]] = []
    if "avg_views_per_video" in df.columns:
        for cat, sub in df.groupby("channel_category", dropna=True):
            vals = sub["avg_views_per_video"].dropna().tolist()
            if not vals:
                continue
            arr = np.array(vals, dtype=float)
            c1_rows.append(
                {
                    "channel_category": cat,
                    "min": float(arr.min()),
                    "q1": float(np.percentile(arr, 25)),
                    "median": float(np.percentile(arr, 50)),
                    "q3": float(np.percentile(arr, 75)),
                    "max": float(arr.max()),
                    "count": int(len(arr)),
                }
            )

    c2_cols = [
        "channel_id",
        "channel_name",
        "channel_category",
        "subscriber_count",
        "avg_views_per_video",
        "subscriber_tier",
    ]
    c2_existing = [col for col in c2_cols if col in df.columns]
    c2 = _records(df[c2_existing])

    return {
        "c1_box_by_category": c1_rows,
        "c2_sub_vs_avgviews_scatter": c2,
        "row_count": int(len(df)),
    }


def get_anomaly(
    channel_id: str | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
) -> dict[str, Any]:
    v, _ = _require_loaded()
    df = v.copy()
    if channel_id:
        df = df[df["channel_id"] == channel_id]
    if year_from is not None:
        df = df[df["year"] >= year_from]
    if year_to is not None:
        df = df[df["year"] <= year_to]

    d1_cols = [
        "video_id",
        "channel_name",
        "title",
        "view_count",
        "like_view_ratio",
        "suspect_fake_view",
        "year",
    ]
    d1_existing = [col for col in d1_cols if col in df.columns]
    d1_df = df[d1_existing].dropna(subset=["view_count", "like_view_ratio"], how="any")
    if len(d1_df) > 1000:
        d1_df = d1_df.sample(n=1000, random_state=42)
    d1 = _records(d1_df)

    if "is_viral" in df.columns:
        viral = df[df["is_viral"] == True]  # noqa: E712
    else:
        viral = df.nlargest(15, "view_count") if "view_count" in df.columns else df

    d2_cols = [
        "video_id",
        "channel_name",
        "title",
        "view_count",
        "engagement_rate",
        "published_at",
    ]
    d2_existing = [col for col in d2_cols if col in df.columns]
    d2_df = viral[d2_existing].sort_values("view_count", ascending=False).head(15)
    d2 = _records(d2_df)

    return {
        "d1_view_lvr_scatter": d1,
        "d2_top_viral": d2,
        "total_filtered": int(len(df)),
    }


def get_interaction(
    categories: list[str] | None = None, duration_group: str | None = None
) -> dict[str, Any]:
    v, c = _require_loaded()
    df = v.copy()
    if categories:
        df = df[df["channel_category"].isin(categories)]
    if duration_group:
        df = df[df["duration_group"] == duration_group]

    if "channel_id" in df.columns and "subscriber_tier" in c.columns:
        tier_map = c.set_index("channel_id")["subscriber_tier"]
        df = df.assign(subscriber_tier=df["channel_id"].map(tier_map))

    e1_rows: list[dict[str, Any]] = []
    if "engagement_rate" in df.columns and "duration_group" in df.columns:
        for (dg, tier), sub in df.groupby(["duration_group", "subscriber_tier"], dropna=True):
            vals = sub["engagement_rate"].dropna().to_numpy(dtype=float)
            if len(vals) == 0:
                continue
            e1_rows.append(
                {
                    "duration_group": dg,
                    "subscriber_tier": tier,
                    "min": float(vals.min()),
                    "q1": float(np.percentile(vals, 25)),
                    "median": float(np.percentile(vals, 50)),
                    "q3": float(np.percentile(vals, 75)),
                    "max": float(vals.max()),
                    "count": int(len(vals)),
                }
            )

    e2_rows: list[dict[str, Any]] = []
    if "_published_dt" in df.columns:
        local = df["_published_dt"].dt.tz_convert("Asia/Ho_Chi_Minh")
        tmp = pd.DataFrame(
            {
                "dow": local.dt.dayofweek,
                "hour": local.dt.hour,
                "engagement_rate": df["engagement_rate"]
                if "engagement_rate" in df.columns
                else 0,
            }
        ).dropna(subset=["dow", "hour"])
        agg = (
            tmp.groupby(["dow", "hour"])
            .agg(
                video_count=("engagement_rate", "size"),
                avg_engagement=("engagement_rate", "mean"),
            )
            .reset_index()
        )
        e2_rows = _records(agg)

    return {
        "e1_engagement_box": e1_rows,
        "e2_dow_hour_heatmap": e2_rows,
        "row_count": int(len(df)),
    }


def get_economy(
    year_from: str | None = "2024-01", categories: list[str] | None = None
) -> dict[str, Any]:
    v, _ = _require_loaded()
    df = v.copy()
    if categories:
        df = df[df["channel_category"].isin(categories)]

    if "_published_dt" not in df.columns:
        return {
            "f1_commercial_monthly": [],
            "f2_commercial_vs_not": [],
            "top10_commercial_channels": [],
            "row_count": 0,
        }

    if year_from:
        try:
            cutoff = pd.Timestamp(f"{year_from}-01" if len(year_from) == 7 else year_from, tz="UTC")
        except Exception:
            cutoff = pd.Timestamp("2024-01-01", tz="UTC")
        df = df[df["_published_dt"] >= cutoff]

    f1_rows: list[dict[str, Any]] = []
    if "is_commercial" in df.columns:
        tmp = pd.DataFrame(
            {
                "month": df["_published_dt"].dt.tz_convert("UTC").dt.to_period("M").astype(str),
                "is_commercial": df["is_commercial"].astype(bool),
                "view_count": df["view_count"] if "view_count" in df.columns else 0,
            }
        )
        agg = (
            tmp.groupby(["month", "is_commercial"])
            .agg(video_count=("view_count", "size"), total_views=("view_count", "sum"))
            .reset_index()
            .sort_values(["month", "is_commercial"])
        )
        f1_rows = _records(agg)

    f2_rows: list[dict[str, Any]] = []
    if "is_commercial" in df.columns and "engagement_rate" in df.columns:
        for flag, sub in df.groupby("is_commercial", dropna=True):
            f2_rows.append(
                {
                    "is_commercial": bool(flag),
                    "video_count": int(len(sub)),
                    "avg_views": float(sub["view_count"].mean())
                    if "view_count" in sub.columns and len(sub)
                    else 0.0,
                    "avg_engagement": float(sub["engagement_rate"].mean()) if len(sub) else 0.0,
                }
            )

    top10: list[dict[str, Any]] = []
    if "is_commercial" in df.columns and "channel_name" in df.columns:
        commercial = df[df["is_commercial"] == True]  # noqa: E712
        if len(commercial):
            top = (
                commercial.groupby(["channel_id", "channel_name"], dropna=True)
                .agg(
                    commercial_count=("video_id", "size")
                    if "video_id" in commercial.columns
                    else ("channel_id", "size"),
                    total_views=("view_count", "sum")
                    if "view_count" in commercial.columns
                    else ("channel_id", "size"),
                )
                .reset_index()
                .sort_values("commercial_count", ascending=False)
                .head(10)
            )
            top10 = _records(top)

    return {
        "f1_commercial_monthly": f1_rows,
        "f2_commercial_vs_not": f2_rows,
        "top10_commercial_channels": top10,
        "row_count": int(len(df)),
        "reference_line": "2024-10",
    }
