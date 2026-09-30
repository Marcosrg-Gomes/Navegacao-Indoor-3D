from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from app.config import get_settings
from secrets import compare_digest

settings = get_settings()

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Verifica a validade da chave de API informada no cabeçalho.
    """
    configured = get_settings()
    for identity, key in configured.ADMIN_API_KEYS.items():
        if api_key and compare_digest(api_key.encode(), key.encode()):
            return identity
    if not api_key or not compare_digest(api_key.encode(), configured.ADMIN_API_KEY.encode()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chave de API inválida"
        )
    return "administrador-compartilhado"
