from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://openenrich:openenrich@localhost:5432/openenrich"
    REDIS_URL: str = "redis://localhost:6379/0"

    ENCRYPTION_MASTER_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "openai"
    DEFAULT_LLM_API_KEY: str = ""
    DEFAULT_LLM_MODEL: str = "gpt-4o-mini"
    PROXY_URLS: str = ""
    WEBHOOK_URL: str = ""


settings = Settings()
