from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    GEMINI_API_KEY: str = ""
    SANDBOX_DIR: Path = Path("./sandbox")
    DB_PATH: Path = Path("./logs.db")
    FRONTEND_URL: str = "http://localhost:3000"


settings = Settings()
