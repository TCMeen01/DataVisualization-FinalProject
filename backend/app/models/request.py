from typing import Any

from pydantic import BaseModel, Field


class DataContext(BaseModel):
    filename: str
    columns: list[str]
    dtypes: dict[str, str] = Field(default_factory=dict)
    sample_rows: list[dict[str, Any]] = Field(default_factory=list)


class GenerateRequest(BaseModel):
    prompt: str
    data_context: DataContext | None = None
    history: list[dict[str, Any]] = Field(default_factory=list)


class ExecuteRequest(BaseModel):
    request_id: str
    code: str
    approved_by: str = "user"
