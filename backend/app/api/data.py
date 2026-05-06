from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter()

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DEFAULT_FILE = "sample.csv"


def _load(filename: str) -> pd.DataFrame:
    path = DATA_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"{filename} not found")
    return pd.read_csv(path)


@router.get("/schema")
async def get_schema(filename: str = DEFAULT_FILE) -> dict:
    df = _load(filename)
    return {
        "filename": filename,
        "columns": df.columns.tolist(),
        "dtypes": {c: str(df[c].dtype) for c in df.columns},
        "row_count": int(len(df)),
        "sample_rows": df.head(5).to_dict(orient="records"),
    }


@router.get("/preview")
async def get_preview(filename: str = DEFAULT_FILE, limit: int = 20) -> dict:
    df = _load(filename).head(limit)
    return {
        "columns": df.columns.tolist(),
        "rows": df.values.tolist(),
    }
