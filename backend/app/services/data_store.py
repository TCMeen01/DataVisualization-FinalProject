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
    
    filtered = v if not category else v[v["channel_category"] == category]

    total_videos = int(len(filtered))
    total_channels = int(filtered["channel_name"].nunique()) if "channel_name" in filtered.columns else 0
    total_views = int(filtered["view_count"].sum()) if "view_count" in filtered.columns else 0
    short_ratio = (
        float(filtered["is_short_form"].mean()) if "is_short_form" in filtered.columns else 0.0
    )

    a1_src = (
        filtered.groupby("channel_category", dropna=True)
        .agg(
            video_count=("video_id", "size"),
            total_views=("view_count", "sum"),
            total_channels=("channel_name", "nunique"),
            short_form_ratio=("is_short_form", "mean"),
        )
        .reset_index()
        .sort_values("video_count", ascending=False)
    )
    a1 = _records(a1_src)

    a2_src = (
        filtered.groupby(["channel_category", "year"], dropna=True)
        .agg(
            total_views=("view_count", "sum"),
            video_count=("video_id", "size"),
            total_channels=("channel_name", "nunique"),
            short_form_ratio=("is_short_form", "mean"),
        )
        .reset_index()
        .sort_values("year")
    )
    a2 = _records(a2_src)

    a3_rows: list[dict[str, Any]] = []
    if "year" in filtered.columns and "is_short_form" in filtered.columns:
        grouped = filtered.groupby(["channel_category", "year"], dropna=True)
        for year, sub in grouped:
            total = int(len(sub))
            shorts = int(sub["is_short_form"].sum())
            longs = total - shorts
            a3_rows.append(
                {
                    "year": int(year[1] if isinstance(year, tuple) else year),
                    "channel_category": str(year[0]) if isinstance(year, tuple) else None,
                    "short_count": shorts,
                    "long_count": longs,
                    "short_ratio": (shorts / total) if total else 0.0,
                    "video_count": total,
                    "total_views": int(sub["view_count"].sum()),
                    "total_channels": int(sub["channel_name"].nunique()),
                    "short_form_ratio": (shorts / total) if total else 0.0,
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
    year_from: int | None = None, year_to: int | None = None, category: str | None = None
) -> dict[str, Any]:
    v, _ = _require_loaded()

    # B1: Heatmap - group by category (if no category selected) or by channel (if category selected)
    if category:
        # Show channels within the selected category
        v_filtered = v[v["channel_category"] == category]
        ratio_df = (
            v_filtered.groupby(["channel_name", "year"], dropna=True)
            .agg(
                short_count=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
                total_count=("is_short_form", "count")
            )
            .reset_index()
        )
        ratio_df["short_form_ratio"] = ratio_df["short_count"] / ratio_df["total_count"]
        group_by_field = "channel_name"
    else:
        # Show categories
        ratio_df = (
            v.groupby(["channel_category", "year"], dropna=True)
            .agg(
                short_count=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
                total_count=("is_short_form", "count")
            )
            .reset_index()
        )
        ratio_df["short_form_ratio"] = ratio_df["short_count"] / ratio_df["total_count"]
        ratio_df["channel_name"] = ratio_df["channel_category"]
        group_by_field = "channel_category"

    if year_from is not None:
        ratio_df = ratio_df[ratio_df["year"] >= year_from]
    if year_to is not None:
        ratio_df = ratio_df[ratio_df["year"] <= year_to]

    # Pivot to create heatmap matrix
    pivot = ratio_df.pivot_table(
        index="channel_name",
        columns="year",
        values="short_form_ratio",
        fill_value=0
    )

    b1_heatmap = {
        "channels": pivot.index.tolist(),
        "years": pivot.columns.tolist(),
        "z": pivot.values.tolist()
    }

    # B2: Stacked bar chart - short vs long by year
    year_counts = v.groupby("year", dropna=True).agg(
        short=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
        long=("is_short_form", lambda x: (x == False).sum())   # noqa: E712
    ).reset_index()

    if year_from is not None:
        year_counts = year_counts[year_counts["year"] >= year_from]
    if year_to is not None:
        year_counts = year_counts[year_counts["year"] <= year_to]
    if category:
        v_cat = v[v["channel_category"] == category]
        year_counts = v_cat.groupby("year", dropna=True).agg(
            short=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
            long=("is_short_form", lambda x: (x == False).sum())   # noqa: E712
        ).reset_index()
        if year_from is not None:
            year_counts = year_counts[year_counts["year"] >= year_from]
        if year_to is not None:
            year_counts = year_counts[year_counts["year"] <= year_to]

    b2_bar = [
        {
            "label": str(int(row["year"])),
            "short": int(row["short"]),
            "long": int(row["long"])
        }
        for _, row in year_counts.iterrows()
    ]

    pivot_channels = _compute_pivot_channels(v)

    return {
        "b1_heatmap": b1_heatmap,
        "b2_bar": b2_bar,
        "pivot_channels": pivot_channels,
    }


def _compute_pivot_channels(v: pd.DataFrame) -> list[dict[str, Any]]:
    if "year" not in v.columns or "is_short_form" not in v.columns:
        return []

    def _ratio_for(window: pd.DataFrame) -> pd.DataFrame:
        grp = (
            window.groupby("channel_name", dropna=True)
            .agg(
                short_count=("is_short_form", lambda s: int((s == True).sum())),  # noqa: E712
                total_count=("is_short_form", "count"),
            )
            .reset_index()
        )
        grp = grp[grp["total_count"] > 0]
        grp["ratio"] = grp["short_count"] / grp["total_count"]
        return grp[["channel_name", "ratio"]]

    old = _ratio_for(v[v["year"] < 2020]).rename(columns={"ratio": "ratio_old"})
    new = _ratio_for(v[v["year"] >= 2024]).rename(columns={"ratio": "ratio_new"})

    merged = pd.merge(old, new, on="channel_name", how="inner")
    if merged.empty:
        return []
    merged["diff"] = merged["ratio_new"] - merged["ratio_old"]
    top5 = merged.nlargest(5, "diff")
    return [
        {
            "channel_name": str(row["channel_name"]),
            "ratio_old": float(row["ratio_old"]),
            "ratio_new": float(row["ratio_new"]),
            "diff": float(row["diff"]),
        }
        for _, row in top5.iterrows()
    ]


def get_channels_data(
    category: str | None = None, tier: str | None = None
) -> dict[str, Any]:
    v, c = _require_loaded()
    df = c.copy()
    if category:
        df = df[df["channel_category"] == category]
    if tier:
        df = df[df["subscriber_tier"] == tier]

    # C1: Box plot data - raw values per category for Plotly to calculate box stats
    c1_box: list[dict[str, Any]] = []
    if "avg_views_per_video" in df.columns:
        for cat, sub in df.groupby("channel_category", dropna=True):
            vals = sub["avg_views_per_video"].dropna().tolist()
            if vals:
                c1_box.append({
                    "category": cat,
                    "values": vals
                })

    # C2: Scatter plot data
    c2_cols = [
        "channel_id",
        "channel_name",
        "channel_category",
        "subscriber_count",
        "avg_views_per_video",
        "subscriber_tier",
        "video_count"
    ]
    c2_existing = [col for col in c2_cols if col in df.columns]
    c2_records = _records(df[c2_existing])

    # Rename fields to match frontend expectations
    c2_scatter = []
    for rec in c2_records:
        c2_scatter.append({
            "channel_name": rec.get("channel_name"),
            "subscriber_count": rec.get("subscriber_count"),
            "avg_views": rec.get("avg_views_per_video"),
            "video_count": rec.get("video_count"),
            "category": rec.get("channel_category")
        })

    median_by_year = _compute_median_by_year(v, category=category)

    return {
        "c1_box": c1_box,
        "c2_scatter": c2_scatter,
        "median_by_year": median_by_year,
    }


def _compute_median_by_year(
    v: pd.DataFrame, category: str | None = None
) -> list[dict[str, Any]]:
    if "year" not in v.columns or "channel_category" not in v.columns or "view_count" not in v.columns:
        return []
    df = v if not category else v[v["channel_category"] == category]
    grouped = (
        df.dropna(subset=["year", "channel_category"])
        .groupby(["year", "channel_category"])["view_count"]
        .median()
        .reset_index()
        .rename(columns={"view_count": "median_views"})
        .sort_values(["year", "channel_category"])
    )
    return [
        {
            "year": int(row["year"]),
            "category": str(row["channel_category"]),
            "median_views": float(row["median_views"]),
        }
        for _, row in grouped.iterrows()
    ]


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

    # D1: Scatter plot data
    d1_cols = [
        "title",
        "channel_name",
        "view_count",
        "like_view_ratio",
        "suspect_fake_view",
    ]
    d1_existing = [col for col in d1_cols if col in df.columns]
    d1_df = df[d1_existing].dropna(subset=["view_count", "like_view_ratio"], how="any")
    if len(d1_df) > 1000:
        d1_df = d1_df.sample(n=1000, random_state=42)

    d1_scatter = []
    for _, row in d1_df.iterrows():
        d1_scatter.append({
            "title": row.get("title"),
            "channel": row.get("channel_name"),
            "view_count": int(row.get("view_count", 0)),
            "like_view_ratio": float(row.get("like_view_ratio", 0)),
            "suspect_fake_view": bool(row.get("suspect_fake_view", False))
        })

    # D2: Top viral videos
    if "is_viral" in df.columns:
        viral = df[df["is_viral"] == True]  # noqa: E712
    else:
        viral = df.nlargest(15, "view_count") if "view_count" in df.columns else df

    d2_cols = ["title", "channel_name", "view_count", "is_viral"]
    d2_existing = [col for col in d2_cols if col in df.columns]
    d2_df = viral[d2_existing].sort_values("view_count", ascending=False).head(15)

    d2_viral = []
    for idx, row in enumerate(d2_df.iterrows(), start=1):
        _, data = row
        d2_viral.append({
            "rank": idx,
            "title": data.get("title"),
            "channel": data.get("channel_name"),
            "view_count": int(data.get("view_count", 0)),
            "is_viral": bool(data.get("is_viral", False))
        })

    return {
        "d1_scatter": d1_scatter,
        "d2_viral": d2_viral,
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

    # Join with channels to get subscriber_tier
    if "channel_id" in df.columns and "subscriber_tier" in c.columns:
        tier_map = c.set_index("channel_id")["subscriber_tier"]
        df = df.assign(subscriber_tier=df["channel_id"].map(tier_map))

    # E1: Box plot data - raw values for each duration_group × tier combination
    e1_box: list[dict[str, Any]] = []
    if "engagement_rate" in df.columns and "duration_group" in df.columns:
        for (dg, tier), sub in df.groupby(["duration_group", "subscriber_tier"], dropna=True):
            vals = sub["engagement_rate"].dropna().tolist()
            if vals:
                e1_box.append({
                    "label": str(dg),
                    "tier": str(tier),
                    "values": vals
                })

    # E2: Heatmap of day_of_week × hour_posted
    e2_heatmap = {"days": [], "hours": [], "z": []}
    if "_published_dt" in df.columns:
        local = df["_published_dt"].dt.tz_convert("Asia/Ho_Chi_Minh")
        tmp = pd.DataFrame({
            "dow": local.dt.dayofweek,
            "hour": local.dt.hour,
            "view_count": df["view_count"] if "view_count" in df.columns else 0,
        }).dropna(subset=["dow", "hour"])

        # Pivot to create heatmap matrix
        pivot = tmp.pivot_table(
            index="dow",
            columns="hour",
            values="view_count",
            aggfunc="mean",
            fill_value=0
        )

        # Day names in Vietnamese
        day_names = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]
        e2_heatmap = {
            "days": [day_names[int(d)] for d in pivot.index],
            "hours": pivot.columns.tolist(),
            "z": pivot.values.tolist()
        }

    tag_engagement = _compute_tag_engagement(df)

    return {
        "e1_box": e1_box,
        "e2_heatmap": e2_heatmap,
        "tag_engagement": tag_engagement,
    }


def _compute_tag_engagement(df: pd.DataFrame) -> list[dict[str, Any]]:
    needed = {"tag_count", "engagement_rate", "channel_category"}
    if not needed.issubset(df.columns):
        return []
    sub = df[list(needed)].dropna()
    if sub.empty:
        return []
    if len(sub) > 2000:
        sub = sub.sample(n=2000, random_state=42)
    return [
        {
            "tag_count": int(row["tag_count"]),
            "engagement_rate": float(row["engagement_rate"]),
            "channel_category": str(row["channel_category"]),
        }
        for _, row in sub.iterrows()
    ]


def get_economy(
    year_from: str | None = "2024-01", categories: list[str] | None = None
) -> dict[str, Any]:
    v, _ = _require_loaded()
    df = v.copy()
    if categories:
        df = df[df["channel_category"].isin(categories)]

    if "_published_dt" not in df.columns:
        return {
            "f1_line": [],
            "f2_bar": [],
            "top_commercial_channels": [],
        }

    if year_from:
        try:
            cutoff = pd.Timestamp(f"{year_from}-01" if len(year_from) == 7 else year_from, tz="UTC")
        except Exception:
            cutoff = pd.Timestamp("2024-01-01", tz="UTC")
        df = df[df["_published_dt"] >= cutoff]

    # F1: Line chart - commercial video count by month
    f1_line: list[dict[str, Any]] = []
    if "is_commercial" in df.columns:
        commercial_df = df[df["is_commercial"] == True]  # noqa: E712
        tmp = pd.DataFrame({
            "month": commercial_df["_published_dt"].dt.tz_convert("UTC").dt.to_period("M").astype(str),
        })
        monthly_counts = tmp.groupby("month").size().reset_index(name="count")
        f1_line = [
            {"month": row["month"], "count": int(row["count"])}
            for _, row in monthly_counts.iterrows()
        ]

    # F2: Bar chart - avg views commercial vs non-commercial by category
    f2_bar: list[dict[str, Any]] = []
    if "is_commercial" in df.columns and "channel_category" in df.columns:
        for cat, sub in df.groupby("channel_category", dropna=True):
            commercial = sub[sub["is_commercial"] == True]  # noqa: E712
            non_commercial = sub[sub["is_commercial"] == False]  # noqa: E712

            f2_bar.append({
                "category": cat,
                "commercial": float(commercial["view_count"].mean()) if len(commercial) and "view_count" in commercial.columns else 0.0,
                "non_commercial": float(non_commercial["view_count"].mean()) if len(non_commercial) and "view_count" in non_commercial.columns else 0.0,
            })

    # Top 10 commercial channels
    top_commercial_channels: list[dict[str, Any]] = []
    if "is_commercial" in df.columns and "channel_name" in df.columns:
        commercial = df[df["is_commercial"] == True]  # noqa: E712
        if len(commercial):
            top = (
                commercial.groupby(["channel_id", "channel_name"], dropna=True)
                .size()
                .reset_index(name="commercial_count")
                .sort_values("commercial_count", ascending=False)
                .head(10)
            )
            top_commercial_channels = [
                {"channel_name": row["channel_name"], "commercial_count": int(row["commercial_count"])}
                for _, row in top.iterrows()
            ]

    commercial_view_by_category, commercial_engagement_by_category = (
        _compute_commercial_split(df)
    )

    return {
        "f1_line": f1_line,
        "f2_bar": f2_bar,
        "top_commercial_channels": top_commercial_channels,
        "commercial_view_by_category": commercial_view_by_category,
        "commercial_engagement_by_category": commercial_engagement_by_category,
    }


def _compute_commercial_split(
    df: pd.DataFrame,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if "is_commercial" not in df.columns or "channel_category" not in df.columns:
        return [], []

    has_view = "view_count" in df.columns
    has_engage = "engagement_rate" in df.columns
    view_rows: list[dict[str, Any]] = []
    engage_rows: list[dict[str, Any]] = []

    for cat, sub in df.groupby("channel_category", dropna=True):
        commercial = sub[sub["is_commercial"] == True]  # noqa: E712
        non_commercial = sub[sub["is_commercial"] == False]  # noqa: E712

        if has_view:
            view_rows.append(
                {
                    "category": str(cat),
                    "commercial_avg_view": float(commercial["view_count"].mean())
                    if len(commercial)
                    else 0.0,
                    "non_commercial_avg_view": float(
                        non_commercial["view_count"].mean()
                    )
                    if len(non_commercial)
                    else 0.0,
                }
            )
        if has_engage:
            engage_rows.append(
                {
                    "category": str(cat),
                    "commercial_avg_engagement": float(
                        commercial["engagement_rate"].mean()
                    )
                    if len(commercial)
                    else 0.0,
                    "non_commercial_avg_engagement": float(
                        non_commercial["engagement_rate"].mean()
                    )
                    if len(non_commercial)
                    else 0.0,
                }
            )

    return view_rows, engage_rows


def get_ro1_pivot() -> dict[str, Any]:
    """
    RO1 pivot table: Top 5 channels with highest short-form ratio shift.
    Calculates diff between 2024+ and pre-2020 short-form ratios.
    """
    v, _ = _require_loaded()

    if "year" not in v.columns or "is_short_form" not in v.columns:
        return {"pivot_data": []}

    # Calculate ratio for old period (pre-2020)
    old = v[v["year"] < 2020]
    old_ratios = (
        old.groupby("channel_name", dropna=True)
        .agg(
            short_count=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
            total_count=("is_short_form", "count")
        )
        .reset_index()
    )
    old_ratios["old_ratio"] = old_ratios["short_count"] / old_ratios["total_count"]

    # Calculate ratio for new period (2024+)
    new = v[v["year"] >= 2024]
    new_ratios = (
        new.groupby("channel_name", dropna=True)
        .agg(
            short_count=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
            total_count=("is_short_form", "count")
        )
        .reset_index()
    )
    new_ratios["new_ratio"] = new_ratios["short_count"] / new_ratios["total_count"]

    # Merge and calculate diff
    merged = pd.merge(
        old_ratios[["channel_name", "old_ratio"]],
        new_ratios[["channel_name", "new_ratio"]],
        on="channel_name",
        how="inner"
    )
    merged["diff"] = merged["new_ratio"] - merged["old_ratio"]

    # Get top 5 by diff
    top5 = merged.nlargest(5, "diff")

    pivot_data = [
        {
            "channel_name": row["channel_name"],
            "old_ratio": float(row["old_ratio"]),
            "new_ratio": float(row["new_ratio"]),
            "diff": float(row["diff"])
        }
        for _, row in top5.iterrows()
    ]

    return {"pivot_data": pivot_data}
