from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "ANAS"
    API_V1_STR: str = "/api"
    UPLOAD_DIR: Path = Path("uploads")
    DATABASE_URL: str = "postgresql://postgres:1234567%40byd@localhost:5432/audioDataSets"

    class Config:
        env_file = ".env"

settings = Settings()
