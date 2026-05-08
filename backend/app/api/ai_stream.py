"""
SSE streaming endpoint for AI code generation.
Streams code chunks progressively to provide real-time feedback.
"""
import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..services.llm.gemini import GeminiClient
from ..services.logger import insert_request, update_request_status
from ..config import settings

router = APIRouter(prefix="/api/ai", tags=["ai-stream"])


class GenerateStreamRequest(BaseModel):
    prompt: str
    data_context: dict | None = None


@router.post("/generate-stream")
async def generate_stream(req: GenerateStreamRequest):
    """
    Stream AI-generated code using Server-Sent Events (SSE).

    Returns SSE stream with:
    - data: {code: string, explanation: string} chunks
    - event: done when complete
    - event: error on failure
    """
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt không được để trống")

    # Generate request ID
    request_id = str(uuid.uuid4())

    async def event_generator():
        try:
            # Initialize Gemini client
            client = GeminiClient(api_key=settings.GEMINI_API_KEY, model_name=settings.GEMINI_MODEL)

            # Accumulate full response for logging
            full_code = ""
            full_explanation = ""

            # Stream code generation
            async for chunk in client.generate_stream(
                prompt=req.prompt,
                data_context=req.data_context or {},
            ):
                # Send SSE data event
                yield f"data: {chunk}\n\n"

                # Parse chunk to accumulate
                import json
                try:
                    parsed = json.loads(chunk)
                    full_code = parsed.get("code", full_code)
                    full_explanation = parsed.get("explanation", full_explanation)
                except json.JSONDecodeError:
                    pass

            # Log the completed request
            await insert_request(
                request_id=request_id,
                user_prompt=req.prompt,
                data_context=req.data_context,
                ai_code=full_code,
                ai_explanation=full_explanation,
            )

            # Send done event
            yield f"event: done\ndata: {{'request_id': '{request_id}'}}\n\n"

        except Exception as e:
            # Send error event
            error_msg = str(e).replace("'", "\\'")
            yield f"event: error\ndata: {{'error': '{error_msg}'}}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
