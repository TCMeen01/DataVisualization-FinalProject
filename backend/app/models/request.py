from typing import Any

from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    prompt: str
    data_context: dict[str, Any] | None = None
    history: list[dict[str, Any]] = Field(default_factory=list)


class ExecuteRequest(BaseModel):
    request_id: str
    code: str
