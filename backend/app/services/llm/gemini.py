from app.models.request import DataContext
from app.services.llm.base import LLMClient


class GeminiClient(LLMClient):
    def __init__(self, api_key: str = "") -> None:
        self.api_key = api_key

    async def generate(
        self,
        prompt: str,
        data_context: DataContext | None,
        history: list[dict],
    ) -> dict:
        cols = data_context.columns if data_context else []
        col_hint = ", ".join(cols[:5]) if cols else "<no schema>"
        code = (
            "# Đoạn code mẫu (mock — chưa gọi Gemini thật)\n"
            "import pandas as pd\n"
            "import matplotlib\n"
            "matplotlib.use('Agg')\n"
            "import matplotlib.pyplot as plt\n\n"
            f"# Yêu cầu: {prompt}\n"
            f"# Cột khả dụng: {col_hint}\n"
            "df = pd.read_csv('sample.csv')\n"
            "print(df.head())\n"
            "df.iloc[:, 0].value_counts().head(10).plot(kind='bar')\n"
            "plt.tight_layout()\n"
            "plt.savefig('output.png')\n"
        )
        explanation = (
            "Đây là code mẫu trả về từ stub. Khi cắm Gemini thật, "
            "code sẽ được sinh dựa trên prompt và schema thực tế."
        )
        return {"code": code, "explanation": explanation}
