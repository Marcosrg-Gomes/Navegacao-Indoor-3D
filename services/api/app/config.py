import re
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

INSECURE_EXAMPLE_VALUES = {
    "DATABASE_URL": {
        "mysql+pymysql://root:password@localhost:3306/navegacao_indoor",
    },
    "ADMIN_API_KEY": {"minha-chave-secreta-admin-2024"},
    "SECRET_KEY": {"chave-secreta-jwt-navegacao-indoor"},
}

class Settings(BaseSettings):
    DATABASE_URL: str
    ADMIN_API_KEY: str
    ADMIN_API_KEYS: dict[str, str] = Field(default_factory=dict)
    SECRET_KEY: str
    DEBUG: bool = True
    DIAGNOSTICS_RATE_LIMIT: int = Field(default=60, ge=1, le=600)
    DIAGNOSTICS_RATE_WINDOW_SECONDS: int = Field(default=60, ge=1, le=3600)
    ROUTES_RATE_LIMIT: int = Field(default=30, ge=1, le=600)
    ROUTES_RATE_WINDOW_SECONDS: int = Field(default=60, ge=1, le=3600)
    ROUTE_DISTANCES_RATE_LIMIT: int = Field(default=20, ge=1, le=600)
    ROUTE_DISTANCES_RATE_WINDOW_SECONDS: int = Field(default=60, ge=1, le=3600)
    APP_TITLE: str = "API Navegação Indoor"
    APP_VERSION: str = "1.0.0"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("DATABASE_URL", "ADMIN_API_KEY", "SECRET_KEY")
    @classmethod
    def validar_configuracao_segura(cls, value: str, info):
        value = value.strip()
        if not value:
            raise ValueError(f"Configure {info.field_name} com um valor não vazio")
        if value in INSECURE_EXAMPLE_VALUES[info.field_name]:
            raise ValueError(f"Configure {info.field_name} com um valor próprio e seguro")
        if info.field_name == "ADMIN_API_KEY" and len(value) < 32:
            raise ValueError("Configure ADMIN_API_KEY com ao menos 32 caracteres")
        return value

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
