from fastapi import APIRouter

from app.models.request import ExecuteRequest
from app.models.response import ExecuteResponse

router = APIRouter()


@router.post("", response_model=ExecuteResponse)
async def execute(payload: ExecuteRequest) -> ExecuteResponse:
    return ExecuteResponse(
        request_id=payload.request_id,
        status="completed",
        stdout="(mock) Code đã chạy ở backend.\n",
        stderr="",
        figures=[],
        tables=[],
        execution_time_ms=42,
    )
