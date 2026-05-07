from abc import ABC, abstractmethod
from typing import Any


class LLMClient(ABC):
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        data_context: dict[str, Any] | None,
        history: list[dict] | None = None,
    ) -> dict:
        """Trả về dict {"code": str, "explanation": str}."""
        ...
