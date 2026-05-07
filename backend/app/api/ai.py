import uuid

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models.request import GenerateRequest
from app.models.response import GenerateResponse
from app.services import data_store
from app.services.llm.gemini import GeminiClient
from app.services.logger import insert_request

router = APIRouter()
_llm = GeminiClient(api_key=settings.GEMINI_API_KEY)


@router.post("/generate", response_model=GenerateResponse)
async def generate(payload: GenerateRequest) -> GenerateResponse:
    schema = data_store.get_full_schema()
    try:
        result = await _llm.generate(payload.prompt, schema, payload.history)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    request_id = str(uuid.uuid4())
    await insert_request(
        request_id=request_id,
        user_prompt=payload.prompt,
        data_context=schema,
        ai_code=result["code"],
        ai_explanation=result["explanation"],
    )
    return GenerateResponse(
        request_id=request_id,
        code=result["code"],
        explanation=result["explanation"],
        status="pending",
    )
