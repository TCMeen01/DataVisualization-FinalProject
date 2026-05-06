from typing import Any, Literal

from pydantic import BaseModel, Field

RequestStatus = Literal[
    "pending", "edited", "approved", "executed", "completed", "failed", "rejected"
]


class GenerateResponse(BaseModel):
    request_id: str
    code: str
    explanation: str
    status: RequestStatus = "pending"


class TableResult(BaseModel):
    columns: list[str]
    rows: list[list[Any]]


class ExecuteResponse(BaseModel):
    request_id: str
    status: RequestStatus
    stdout: str = ""
    stderr: str = ""
    figures: list[str] = Field(default_factory=list)
    tables: list[TableResult] = Field(default_factory=list)
    execution_time_ms: int = 0


class LogEntry(BaseModel):
    id: str
    created_at: str
    user_prompt: str
    status: RequestStatus
    execution_time_ms: int | None = None


class SchemaResponse(BaseModel):
    filename: str
    columns: list[str]
    dtypes: dict[str, str]
    row_count: int
    sample_rows: list[dict[str, Any]]
