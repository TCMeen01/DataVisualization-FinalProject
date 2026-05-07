from fastapi import APIRouter, HTTPException, Query

from app.services.logger import get_request, list_requests

router = APIRouter()


@router.get("")
async def get_logs(
    status: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    return await list_requests(status=status, limit=limit, offset=offset)


@router.get("/{request_id}")
async def get_log(request_id: str) -> dict:
    row = await get_request(request_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy request")
    row.pop("execution_result_json", None)
    row.pop("data_context_json", None)
    return row
