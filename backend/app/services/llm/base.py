from abc import ABC, abstractmethod

from app.models.request import DataContext


class LLMClient(ABC):
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        data_context: DataContext | None,
        history: list[dict],
    ) -> dict:
        """Trả về dict {"code": str, "explanation": str}."""
        ...
