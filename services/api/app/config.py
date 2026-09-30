from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import re

class Settings(BaseSettings):
    DATABASE_URL: str
    ADMIN_API_KEY: str
    ADMIN_API_KEYS: dict[str, str] = Field(default_factory=dict)
    SECRET_KEY: str
    DEBUG: bool = True
    APP_TITLE: str = "API Navegação Indoor"
    APP_VERSION: str = "1.0.0"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("ADMIN_API_KEYS")
    @classmethod
    def validar_chaves_nomeadas(cls, value):
        if any(not re.fullmatch(r"[A-Za-z0-9_.-]{1,80}", name) or len(key) < 16 for name, key in value.items()):
            raise ValueError("Use identificadores de até 80 caracteres e chaves de pelo menos 16 caracteres")
        if len(set(value.values())) != len(value):
            raise ValueError("Cada administrador deve possuir uma chave diferente")
        return value

@lru_cache
def get_settings() -> Settings:
    """
    Retorna as configurações da aplicação.
    O uso do @lru_cache garante que as variáveis de ambiente 
    sejam lidas apenas uma vez.
    """
    return Settings()
