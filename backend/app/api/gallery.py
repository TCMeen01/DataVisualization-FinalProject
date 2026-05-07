from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import gallery

router = APIRouter()


class SaveChartBody(BaseModel):
    title: str = Field(default="")
    figure_base64: str
    prompt: str
    request_id: str | None = None


@router.post("/save", status_code=201)
async def save_chart(body: SaveChartBody) -> dict:
    if not body.figure_base64 or not body.prompt:
        raise HTTPException(
            status_code=400,
            detail="Thiếu figure_base64 hoặc prompt",
        )
    title = body.title.strip() or body.prompt[:50]
    return await gallery.save_chart(
        title=title,
        figure_base64=body.figure_base64,
        prompt=body.prompt,
        request_id=body.request_id,
    )


@router.get("")
async def list_charts() -> list[dict]:
    return await gallery.list_charts()


@router.delete("/{chart_id}", status_code=204)
async def delete_chart(chart_id: str) -> None:
    deleted = await gallery.delete_chart(chart_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Không tìm thấy chart")
    return None
