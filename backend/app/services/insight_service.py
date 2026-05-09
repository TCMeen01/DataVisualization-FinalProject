"""
Insight generation service for dashboard pages.
Generates concise, context-aware insights using Gemini LLM.
"""
from __future__ import annotations

import json
from typing import Any

from app.services.llm.gemini import GeminiClient


# Page-specific prompt templates
PAGE_PROMPTS = {
    "anomaly": "Phân tích dữ liệu video viral và bất thường. Tập trung vào: video có lượt xem cao bất thường, tỉ lệ thích/lượt xem thấp, kênh lan truyền mạnh.",
    "channels": "Phân tích tăng trưởng kênh theo danh mục và nhóm người đăng ký. Tập trung vào: phân bố lượt xem, điểm ngoại lệ, xu hướng theo tier.",
    "economy": "Phân tích xu hướng video thương mại và YouTube Shopping. Tập trung vào: số lượng video thương mại, so sánh với video thường, kênh hàng đầu.",
    "interaction": "Phân tích tỉ lệ tương tác và thời điểm đăng video. Tập trung vào: engagement theo độ dài video, giờ vàng, paradox tương tác.",
    "short-form": "Phân tích xu hướng video ngắn (short-form). Tập trung vào: tỉ lệ video ngắn theo danh mục, xu hướng thay đổi theo thời gian.",
    "overview": "Phân tích tổng quan dataset YouTube Việt Nam. Tập trung vào: quy mô dataset, xu hướng chính, phân bố danh mục.",
}


class InsightService:
    """Service for generating dashboard insights using LLM."""

    def __init__(self, llm_client: GeminiClient):
        self.llm_client = llm_client

    def build_insight_prompt(
        self,
        page: str,
        filters: dict[str, Any],
        summary: dict[str, Any],
    ) -> str:
        """
        Build LLM prompt for insight generation.

        Args:
            page: Dashboard page identifier (anomaly, channels, economy, etc.)
            filters: Current filter parameters
            summary: Data summary statistics

        Returns:
            Formatted prompt string
        """
        # Get page-specific context
        page_context = PAGE_PROMPTS.get(page, PAGE_PROMPTS["overview"])

        # Format filters
        filter_text = ""
        if filters:
            filter_parts = []
            for key, value in filters.items():
                if value is not None and value != "All":
                    filter_parts.append(f"{key}: {value}")
            if filter_parts:
                filter_text = f"\n\nBộ lọc đang áp dụng: {', '.join(filter_parts)}"

        # Format summary
        summary_text = json.dumps(summary, ensure_ascii=False, indent=2)

        # Build full prompt
        prompt = f"""Bạn là chuyên gia phân tích dữ liệu YouTube Việt Nam.

{page_context}

Dữ liệu tóm tắt (đã được lọc):
{summary_text}{filter_text}

Yêu cầu:
- Đưa ra insight ngắn gọn (1-2 câu, tối đa 100 từ)
- Tập trung vào pattern hoặc điểm nổi bật nhất
- Sử dụng tiếng Việt tự nhiên
- Không giải thích phương pháp phân tích
- Trả về CHÍNH XÁC insight text, không thêm prefix hay format

Insight:"""
        print(f"DEBUG - summary_text={summary_text}\n")
        print(f"DEBUG - filter_text={filter_text}")

        return prompt

    def truncate_insight(self, text: str, max_words: int = 150) -> str:
        """
        Truncate insight to max words or first 2 sentences.

        Args:
            text: Original insight text
            max_words: Maximum word count

        Returns:
            Truncated text
        """
        text = text.strip()

        # Check word count
        words = text.split()
        if len(words) <= max_words:
            # Check sentence count
            sentences = text.split('. ')
            if len(sentences) <= 2:
                return text
            # Return first 2 sentences
            return '. '.join(sentences[:2]) + '.'

        # Truncate to max words, then to sentence boundary
        truncated = ' '.join(words[:max_words])
        last_period = truncated.rfind('.')
        if last_period > 0:
            return truncated[:last_period + 1]
        return truncated + '...'

    async def generate_insight(
        self,
        page: str,
        filters: dict[str, Any],
        summary: dict[str, Any],
    ) -> str:
        """
        Generate insight for dashboard page.

        Args:
            page: Dashboard page identifier
            filters: Current filter parameters
            summary: Data summary statistics

        Returns:
            Generated insight text

        Raises:
            RuntimeError: If LLM generation fails
        """
        # Check for empty data
        if not summary or all(v == 0 or v == [] or v == {} for v in summary.values()):
            return "Không đủ dữ liệu để phân tích với bộ lọc hiện tại."

        # Build prompt
        prompt = self.build_insight_prompt(page, filters, summary)

        # Call LLM (note: GeminiClient.generate expects data_context, but we're using prompt directly)
        # We'll pass None for data_context since we've already formatted everything in the prompt
        try:
            # GeminiClient.generate returns {"code": ..., "explanation": ...}
            # For insights, we'll use the full prompt as the user request
            # and pass empty data_context
            result = await self.llm_client.generate(
                prompt=prompt,
                data_context=None,
                history=None,
            )

            # Extract insight from response
            # The LLM might return in "explanation" field or "code" field
            insight = result.get("explanation", "") or result.get("code", "")

            if not insight or "Lỗi" in insight:
                raise RuntimeError(insight or "Không thể tạo insight")

            # Truncate if needed
            insight = self.truncate_insight(insight)

            return insight

        except Exception as e:
            error_msg = str(e)
            if "API" in error_msg or "Gemini" in error_msg:
                return "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau."
            return f"Lỗi khi tạo insight: {error_msg[:100]}"
