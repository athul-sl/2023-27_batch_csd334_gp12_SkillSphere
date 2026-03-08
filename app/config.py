"""Application configuration using Pydantic Settings."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    app_name: str = "SkillSphere"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-this-in-production"
    
    # Database
    database_url: str = "postgresql+asyncpg://skillhub:skillhub123@localhost:5432/skillhub"
    database_url_sync: str = "postgresql://skillhub:skillhub123@localhost:5432/skillhub"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT
    jwt_secret_key: str = "change-this-jwt-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # College Domain
    allowed_email_domain: str = "ceconline.edu"
    
    # Admin
    admin_email: str = "admin@ceconline.edu"
    admin_password: str = "Admin@123"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
