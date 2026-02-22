from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    # App config
    PROJECT_NAME: str = "Gandarva API"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENV: Literal["dev", "prod", "test"] = "dev"
    DEVICE: Literal["cpu", "cuda"] = "cpu"
    LOG_LEVEL: str = "INFO"
    
    # Storage & Limits
    MAX_UPLOAD_MB: int = 50
    MAX_DURATION_MIN: int = 10
    STORAGE_RETENTION_DAYS: int = 30
    
    # ML Pipeline
    ENABLE_ML_PIPELINE: bool = True
    CONFIDENCE_MIN: float = 0.5
    CONFIDENCE_MAX: float = 0.8
    POST_MIN_DURATION: float = 0.04
    MERGE_GAP: float = 0.05
    CLUSTER_WINDOW: float = 0.02
    CLUSTER_RATIO: float = 0.5
    
    # Queue / Workers
    QUEUE_MAX_JOBS: int = 20
    CELERY_WORKER_CONCURRENCY: int = 2
    CELERY_MAX_MEMORY_PER_CHILD: int = 1000000
    
    # Database Setup
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "gandarva"
    
    # Auth setup (JWT)
    SECRET_KEY: str = "SUPER_SECRET_KEY_REPLACE_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
