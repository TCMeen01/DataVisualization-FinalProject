from typing import Any, Literal

from pydantic import BaseModel, Field

RequestStatus = Literal[
    "pending",
    "edited",
    "approved",
    "executing",
    "executed",
    "completed",
    "failed",
    "rejected",
]


class GenerateResponse(BaseModel):
    request_id: str
    code: str
    explanation: str
    status: RequestStatus = "pending"


class ExecuteResponse(BaseModel):
    request_id: str
    status: RequestStatus
    stdout: str = ""
    stderr: str = ""
    figures: list[str] = Field(default_factory=list)
    execution_time_ms: int = 0
    error_message: str | None = None


class LogListItem(BaseModel):
    id: str
    created_at: str
    user_prompt: str
    status: RequestStatus
    execution_time_ms: int | None = None
    was_edited: bool = False


class LogListResponse(BaseModel):
    total: int
    items: list[LogListItem]


class LogDetail(BaseModel):
    id: str
    created_at: str
    user_prompt: str
    data_context: dict[str, Any] | None = None
    ai_code: str | None = None
    ai_explanation: str | None = None
    edited_code: str | None = None
    was_edited: bool = False
    status: RequestStatus
    execution_result: dict[str, Any] | None = None
    error_message: str | None = None
    execution_time_ms: int | None = None


class SchemaColumn(BaseModel):
    name: str
    dtype: str
    null_count: int
    min: Any | None = None
    max: Any | None = None
    mean: float | None = None


class SchemaTable(BaseModel):
    row_count: int
    columns: list[SchemaColumn]


class SchemaResponse(BaseModel):
    videos: SchemaTable
    channels: SchemaTable


class PreviewResponse(BaseModel):
    rows: list[dict[str, Any]]
