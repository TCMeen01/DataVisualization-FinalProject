from fastapi import APIRouter, HTTPException

from app.services.logger import list_requests

router = APIRouter()


@router.get("")
async def get_logs() -> list[dict]:
    return await list_requests()


@router.get("/{request_id}")
async def get_log(request_id: str) -> dict:
    items = await list_requests(limit=500)
    for it in items:
        if it["id"] == request_id:
            return it
    raise HTTPException(status_code=404, detail="request not found")
