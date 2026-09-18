from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    ADMIN_API_KEY: str
    SECRET_KEY: str
    DEBUG: bool = True
    APP_TITLE: str = "API Navegação Indoor"
    APP_VERSION: str = "1.0.0"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

@lru_cache
def get_settings() -> Settings:
    """
    Retorna as configurações da aplicação.
    O uso do @lru_cache garante que as variáveis de ambiente 
    sejam lidas apenas uma vez.
    """
    return Settings()
