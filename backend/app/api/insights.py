"""
API endpoints for insight generation.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import settings
from app.services.insight_service import InsightService
from app.services.llm.gemini import GeminiClient

router = APIRouter(prefix="/api/insights", tags=["insights"])

# Initialize LLM client and insight service
_llm_client = GeminiClient(api_key=settings.GEMINI_API_KEY, model_name=settings.GEMINI_MODEL)
_insight_service = InsightService(_llm_client)

# Simple in-memory rate limiting (per session)
_rate_limit_store: dict[str, list[float]] = {}
RATE_LIMIT_MAX = 10  # requests
RATE_LIMIT_WINDOW = 60  # seconds


class InsightRequest(BaseModel):
    """Request model for insight generation."""

    page: str = Field(..., description="Dashboard page identifier (anomaly, channels, economy, etc.)")
    filters: dict[str, Any] = Field(default_factory=dict, description="Current filter parameters")
    summary: dict[str, Any] = Field(..., description="Data summary statistics")


class InsightResponse(BaseModel):
    """Response model for insight generation."""

    insight: str = Field(..., description="Generated insight text")


def check_rate_limit(session_id: str) -> bool:
    """
    Check if request is within rate limit.

    Args:
        session_id: Session identifier (IP address or session token)

    Returns:
        True if within limit, False if exceeded
    """
    import time

    now = time.time()

    # Get or create request history for this session
    if session_id not in _rate_limit_store:
        _rate_limit_store[session_id] = []

    # Remove old requests outside the window
    _rate_limit_store[session_id] = [
        ts for ts in _rate_limit_store[session_id] if now - ts < RATE_LIMIT_WINDOW
    ]

    # Check if limit exceeded
    if len(_rate_limit_store[session_id]) >= RATE_LIMIT_MAX:
        return False

    # Add current request
    _rate_limit_store[session_id].append(now)
    return True


@router.post("", response_model=InsightResponse)
async def generate_insight(request: InsightRequest, req: Request) -> InsightResponse:
    """
    Generate insight for dashboard page.

    Args:
        request: Insight generation request
        req: FastAPI request object (for rate limiting)

    Returns:
        Generated insight

    Raises:
        HTTPException: 400 for invalid request, 429 for rate limit, 503 for LLM errors
    """
    # Rate limiting based on client IP
    client_ip = req.client.host if req.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.",
        )

    # Validate page
    valid_pages = {"anomaly", "channels", "economy", "interaction", "short-form", "overview"}
    if request.page not in valid_pages:
        raise HTTPException(
            status_code=400,
            detail=f"Trang không hợp lệ. Phải là một trong: {', '.join(valid_pages)}",
        )

    # Validate summary
    if not request.summary:
        raise HTTPException(
            status_code=400,
            detail="Thiếu dữ liệu tóm tắt (summary).",
        )

    try:
        # Generate insight
        insight = await _insight_service.generate_insight(
            page=request.page,
            filters=request.filters,
            summary=request.summary,
        )

        return InsightResponse(insight=insight)

    except RuntimeError as e:
        # LLM service error
        raise HTTPException(
            status_code=503,
            detail=f"Dịch vụ AI tạm thời không khả dụng: {str(e)}",
        )
    except Exception as e:
        # Unexpected error
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi không xác định: {str(e)}",
        )
